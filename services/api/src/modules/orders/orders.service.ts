import { prisma } from '@doorli/db';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { emitOrderEvent } from '../../lib/socket.js';
import { enqueueNotification } from '../../lib/notifications.js';

export async function createOrder(data: {
  customerId: string;
  vendorId: string;
  paymentMethod: PaymentMethod;
  deliveryAddressId?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  promoCode?: string;
}) {
  let discountAmount = 0;
  if (data.promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: data.promoCode.toUpperCase() } });
    if (promo && promo.isActive && (!promo.expiresAt || promo.expiresAt > new Date())) {
      if (promo.maxUses == null || promo.usedCount < promo.maxUses) {
        const sub = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        discountAmount =
          promo.discountType === 'percent'
            ? Math.round((sub * Number(promo.discountValue)) / 100)
            : Number(promo.discountValue);
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = 300;
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  let finalDeliveryAddressId = data.deliveryAddressId;
  if (!finalDeliveryAddressId && data.deliveryAddress) {
    const addr = await prisma.address.create({
      data: {
        userId: data.customerId,
        label: 'home',
        addressLine: data.deliveryAddress,
      },
    });
    finalDeliveryAddressId = addr.id;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      vendorId: data.vendorId,
      deliveryAddressId: finalDeliveryAddressId,
      paymentMethod: data.paymentMethod,
      paymentStatus: PaymentStatus.pending,
      specialInstructions: data.specialInstructions,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
      vendor: {
        select: {
          id: true,
          businessName: true,
          addressLine: true,
          userId: true,
        },
      },
    },
  });

  emitOrderEvent('order:new_order', [`vendor:${order.vendorId}`, `customer:${order.customerId}`], {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
  });

  await enqueueNotification({
    userId: order.vendor.userId,
    title: 'New order',
    body: `Order ${order.orderNumber} received`,
    type: 'order_new',
    data: { orderId: order.id },
  });

  return order;
}

export async function getOrdersByCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
      vendor: {
        select: { id: true, businessName: true, logoUrl: true },
      },
    },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      vendor: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          addressLine: true,
          latitude: true,
          longitude: true,
        },
      },
      deliveryAddress: true,
      driver: {
        select: { id: true, fullName: true, phone: true },
      },
    },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      vendor: { select: { userId: true, businessName: true } },
    },
  });

  emitOrderEvent(
    'order:status_update',
    [`order:${order.id}`, `customer:${order.customerId}`, `vendor:${order.vendorId}`],
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    },
  );

  await enqueueNotification({
    userId: order.customerId,
    title: 'Order update',
    body: `Your order ${order.orderNumber} is now ${status.replace('_', ' ')}`,
    type: 'order_status',
    data: { orderId: order.id, status },
  });

  // Award loyalty points on delivery
  if (status === OrderStatus.delivered) {
    const points = Math.floor(Number(order.totalAmount) / 100);
    if (points > 0) {
      await prisma.loyaltyPoint.upsert({
        where: { userId: order.customerId },
        create: {
          userId: order.customerId,
          points,
          earned: points,
          redeemed: 0,
        },
        update: {
          points: { increment: points },
          earned: { increment: points },
        },
      });
    }

    // Mark COD paid when delivered if still pending
    if (order.paymentMethod === PaymentMethod.cod && order.paymentStatus === PaymentStatus.pending) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.paid },
      });
      await prisma.payment.updateMany({
        where: {
          referenceId: order.id,
          referenceType: 'order',
          method: PaymentMethod.cod,
          status: PaymentStatus.pending,
        },
        data: { status: PaymentStatus.paid },
      });
    }
  }

  return order;
}

export async function getVendorOrders(vendorId: string, status?: OrderStatus) {
  return prisma.order.findMany({
    where: {
      vendorId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
      deliveryAddress: true,
    },
  });
}

export async function getOrdersForVendorUser(userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) return [];
  return getVendorOrders(vendor.id);
}
