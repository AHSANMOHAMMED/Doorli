import { prisma, OrderStatus, Prisma, type Product, type Vendor } from '@doorli/db';
import type { UserRole } from '@doorli/types';
import { calculateDeliveryFee, generateOrderNumber, haversineKm } from '@doorli/utils';
import { AppError } from '../../middleware/errorHandler.js';
import { emitOrderEvent } from '../../lib/socket.js';
import { getDispatchService } from '../../lib/dispatch.js';
import { creditDriverOnDelivery } from '../drivers/drivers.service.js';
import type { CreateOrderInput, PreviewOrderInput } from './orders.schema.js';

const DELIVERY_BASE_FEE = 50;
const DELIVERY_PER_KM = 25;
const CANCEL_WINDOW_MS = 2 * 60 * 1000;
const DEFAULT_DISTANCE_KM = 2;
const DEFAULT_DRIVER_RADIUS_KM = 10;

const orderSelect = {
  id: true,
  orderNumber: true,
  customerId: true,
  vendorId: true,
  driverId: true,
  deliveryAddressId: true,
  status: true,
  orderType: true,
  subtotal: true,
  deliveryFee: true,
  discountAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  estimatedDeliveryTime: true,
  specialInstructions: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      notes: true,
      product: { select: { id: true, name: true, imageUrl: true, unit: true } },
    },
  },
  vendor: { select: { id: true, businessName: true, phone: true } },
  deliveryAddress: {
    select: {
      id: true,
      label: true,
      addressLine: true,
      city: true,
      latitude: true,
      longitude: true,
    },
  },
};

type OrderItemInput = { productId: string; quantity: number };

async function resolveLineItems(vendorId: string, items: OrderItemInput[]) {
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, vendorId },
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products are invalid for this shop');
  }

  const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));
  let subtotal = 0;
  const lineItems: {
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId) as Product;
    if (!product.isAvailable) {
      throw new AppError(400, `${product.name} is not available`);
    }
    if (product.stockQuantity < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${product.name}`);
    }

    const unitPrice = product.discountPrice ?? product.price;
    const lineTotal = Number(unitPrice) * item.quantity;
    subtotal += lineTotal;
    lineItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      totalPrice: new Prisma.Decimal(lineTotal),
    });
  }

  return { subtotal, lineItems };
}

function computeDeliveryFee(
  orderType: 'delivery' | 'pickup',
  vendorLat: number | null,
  vendorLng: number | null,
  destLat: number | null,
  destLng: number | null,
): number {
  if (orderType === 'pickup') return 0;

  let distanceKm = DEFAULT_DISTANCE_KM;
  if (vendorLat != null && vendorLng != null && destLat != null && destLng != null) {
    distanceKm = haversineKm(vendorLat, vendorLng, destLat, destLng);
  }

  return calculateDeliveryFee({
    baseFee: DELIVERY_BASE_FEE,
    distanceKm,
    perKmRate: DELIVERY_PER_KM,
  });
}

export async function previewOrder(input: PreviewOrderInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  const { subtotal } = await resolveLineItems(input.vendorId, input.items);

  const deliveryFee = computeDeliveryFee(
    input.orderType,
    vendor.latitude ? Number(vendor.latitude) : null,
    vendor.longitude ? Number(vendor.longitude) : null,
    input.latitude ?? null,
    input.longitude ?? null,
  );

  return {
    subtotal,
    deliveryFee,
    discountAmount: 0,
    totalAmount: subtotal + deliveryFee,
    orderType: input.orderType,
  };
}

export async function createOrder(customerId: string, input: CreateOrderInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  if (!vendor.isOpen) throw new AppError(400, 'This shop is currently closed');

  const { subtotal, lineItems } = await resolveLineItems(input.vendorId, input.items);

  if (vendor.minOrderAmount && subtotal < Number(vendor.minOrderAmount)) {
    throw new AppError(
      400,
      `Minimum order amount is LKR ${Number(vendor.minOrderAmount).toLocaleString('en-LK')}`,
    );
  }

  let deliveryAddressId = input.deliveryAddressId;

  if (input.newAddress) {
    if (input.newAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId: customerId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: {
        userId: customerId,
        label: input.newAddress.label,
        addressLine: input.newAddress.addressLine,
        city: input.newAddress.city,
        latitude: input.newAddress.latitude,
        longitude: input.newAddress.longitude,
        isDefault: input.newAddress.isDefault ?? false,
      },
    });
    deliveryAddressId = address.id;
  }

  let destLat: number | null = input.newAddress?.latitude ?? null;
  let destLng: number | null = input.newAddress?.longitude ?? null;

  if (input.orderType === 'delivery' && deliveryAddressId) {
    const address = await prisma.address.findFirst({
      where: { id: deliveryAddressId, userId: customerId },
    });
    if (!address) throw new AppError(400, 'Delivery address not found');
    destLat = address.latitude ? Number(address.latitude) : destLat;
    destLng = address.longitude ? Number(address.longitude) : destLng;
  }

  const deliveryFee = computeDeliveryFee(
    input.orderType,
    vendor.latitude ? Number(vendor.latitude) : null,
    vendor.longitude ? Number(vendor.longitude) : null,
    destLat,
    destLng,
  );

  const totalAmount = subtotal + deliveryFee;
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const item of lineItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
          isAvailable: true,
        },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new AppError(409, 'Stock changed — please refresh your cart');
      }
    }

    return tx.order.create({
      data: {
        orderNumber,
        customerId,
        vendorId: input.vendorId,
        deliveryAddressId: input.orderType === 'delivery' ? deliveryAddressId : null,
        status: 'pending',
        orderType: input.orderType,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod: input.paymentMethod,
        specialInstructions: input.specialInstructions,
        estimatedDeliveryTime: input.orderType === 'delivery' ? 45 : 20,
        items: { create: lineItems },
      },
      select: orderSelect,
    });
  });

  emitOrderEvent('order:new_order', [`vendor:${vendor.id}`], {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
  });

  return order;
}

export async function listCustomerOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function listVendorOrders(vendorUserId: string, status?: OrderStatus) {
  const vendor = await prisma.vendor.findUnique({ where: { userId: vendorUserId } });
  if (!vendor) throw new AppError(404, 'No shop registered');

  return prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      ...(status ? { status } : {}),
    },
    select: {
      ...orderSelect,
      customer: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function listDriverOrders(driverUserId: string) {
  const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
  if (!driver) throw new AppError(404, 'Driver profile not found');

  const active = await prisma.order.findMany({
    where: {
      driverId: driverUserId,
      status: { in: ['ready', 'picked_up'] },
      orderType: 'delivery',
    },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  });

  const readyOrders = await prisma.order.findMany({
    where: {
      status: 'ready',
      driverId: null,
      orderType: 'delivery',
    },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  let available = readyOrders;

  const vendorIds = [...new Set(readyOrders.map((o: { vendorId: string }) => o.vendorId))];
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, latitude: true, longitude: true, deliveryRadiusKm: true },
  });
  const vendorMap = new Map<string, typeof vendors[number]>(vendors.map((v) => [v.id, v]));

  if (driver.currentLatitude != null && driver.currentLongitude != null) {
    const driverLat = Number(driver.currentLatitude);
    const driverLng = Number(driver.currentLongitude);
    available = readyOrders.filter((order: { vendorId: string }) => {
      const vendor = vendorMap.get(order.vendorId) as Vendor | undefined;
      if (!vendor?.latitude || !vendor?.longitude) return true;
      const dist = haversineKm(
        driverLat,
        driverLng,
        Number(vendor.latitude),
        Number(vendor.longitude),
      );
      const radius = vendor.deliveryRadiusKm ?? DEFAULT_DRIVER_RADIUS_KM;
      return dist <= radius;
    });
  } else {
    available = readyOrders;
  }

  return { available, active };
}

export async function acceptOrder(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== 'ready') throw new AppError(400, 'Order is not ready for pickup');
  if (order.driverId) throw new AppError(409, 'Order already assigned to a driver');
  if (order.orderType !== 'delivery') throw new AppError(400, 'Not a delivery order');

  const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
  if (!driver?.isOnline) throw new AppError(400, 'Go online to accept deliveries');

  const dispatch = getDispatchService();
  const hasValidOffer = await dispatch.validateOffer(orderId, driverUserId);
  if (!hasValidOffer) {
    throw new AppError(403, 'No active job offer for this order');
  }

  const updated = await prisma.order.update({
    where: { id: orderId, driverId: null, status: 'ready' },
    data: { driverId: driverUserId },
    select: orderSelect,
  });

  await dispatch.clearDispatch(orderId);

  emitOrderEvent(
    'order:status_update',
    [`order:${orderId}`, `vendor:${order.vendorId}`, `customer:${order.customerId}`],
    { orderId, status: 'ready', driverAssigned: true, orderNumber: updated.orderNumber },
  );

  return updated;
}

export async function declineOrder(orderId: string, driverUserId: string) {
  await getDispatchService().handleDecline(orderId, driverUserId);
  return { message: 'Job declined' };
}

export async function getOrderTrack(orderId: string, userId: string, role: UserRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      vendorId: true,
      driverId: true,
      status: true,
      estimatedDeliveryTime: true,
      updatedAt: true,
      vendor: { select: { id: true, businessName: true, phone: true } },
      driver: { select: { id: true, fullName: true, phone: true } },
    },
  });
  if (!order) throw new AppError(404, 'Order not found');

  await assertOrderAccess(order, userId, role);

  const driverProfile =
    order.driverId != null
      ? await prisma.driver.findUnique({
          where: { userId: order.driverId },
          select: { currentLatitude: true, currentLongitude: true, lastLocationUpdate: true },
        })
      : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    updatedAt: order.updatedAt,
    vendor: order.vendor,
    driver: order.driver
      ? {
          id: order.driver.id,
          fullName: order.driver.fullName,
          phone: order.driver.phone,
          latitude: driverProfile?.currentLatitude
            ? Number(driverProfile.currentLatitude)
            : null,
          longitude: driverProfile?.currentLongitude
            ? Number(driverProfile.currentLongitude)
            : null,
          lastLocationUpdate: driverProfile?.lastLocationUpdate ?? null,
        }
      : null,
  };
}

async function assertOrderAccess(
  order: { customerId: string; vendorId: string; driverId: string | null },
  userId: string,
  role: UserRole,
) {
  if (role === 'admin') return;

  if (role === 'customer' && order.customerId === userId) return;

  if (role === 'vendor') {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (vendor && vendor.id === order.vendorId) return;
  }

  if (role === 'driver' && order.driverId === userId) return;

  throw new AppError(403, 'Access denied');
}

export async function getOrderById(orderId: string, userId: string, role: UserRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      ...orderSelect,
      customer: { select: { id: true, fullName: true, phone: true } },
    },
  });
  if (!order) throw new AppError(404, 'Order not found');

  await assertOrderAccess(order, userId, role);
  return order;
}

export async function cancelOrder(orderId: string, customerId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.customerId !== customerId) throw new AppError(403, 'Access denied');
  if (order.status !== 'pending') {
    throw new AppError(400, 'Only pending orders can be cancelled');
  }

  const elapsed = Date.now() - order.createdAt.getTime();
  if (elapsed > CANCEL_WINDOW_MS) {
    throw new AppError(400, 'Cancellation window has expired (2 minutes)');
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
      select: orderSelect,
    });
  });

  emitOrderEvent(
    'order:status_update',
    [`order:${orderId}`, `vendor:${order.vendorId}`, `customer:${order.customerId}`],
    { orderId, status: 'cancelled' },
  );

  return updated;
}

const VENDOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing'],
  preparing: ['ready'],
};

const DRIVER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ready: ['picked_up'],
  picked_up: ['delivered'],
};

export async function updateOrderStatus(
  orderId: string,
  userId: string,
  role: UserRole,
  nextStatus: OrderStatus,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status === 'cancelled' || order.status === 'delivered') {
    throw new AppError(400, 'Order is already finished');
  }

  if (role === 'vendor') {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor || vendor.id !== order.vendorId) {
      throw new AppError(403, 'Not your order');
    }
    const allowed = VENDOR_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(400, `Cannot move from ${order.status} to ${nextStatus}`);
    }
  } else if (role === 'driver') {
    if (order.driverId !== userId) {
      throw new AppError(403, 'Not assigned to this order');
    }
    const allowed = DRIVER_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(400, `Cannot move from ${order.status} to ${nextStatus}`);
    }
  } else if (role !== 'admin') {
    throw new AppError(403, 'Insufficient permissions');
  }

  const data: Prisma.OrderUpdateInput = { status: nextStatus };
  if (nextStatus === 'delivered') {
    data.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
    if (order.driverId) {
      await creditDriverOnDelivery(order.driverId, Number(order.deliveryFee));
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    select: orderSelect,
  });

  if (nextStatus === 'ready' && order.orderType === 'delivery') {
    void getDispatchService().dispatchOrder(orderId);
  }

  if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
    void getDispatchService().clearDispatch(orderId);
  }

  const rooms = [
    `order:${orderId}`,
    `vendor:${order.vendorId}`,
    `customer:${order.customerId}`,
  ];
  if (order.driverId) rooms.push(`driver:${order.driverId}`);

  emitOrderEvent('order:status_update', rooms, {
    orderId,
    status: nextStatus,
    orderNumber: updated.orderNumber,
  });

  return updated;
}
