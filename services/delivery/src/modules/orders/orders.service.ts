import { prisma } from '@doorli/db';
import { OrderStatus, PaymentMethod, PaymentStatus, type UserRole } from '@prisma/client';
import { haversineKm } from '@doorli/utils';
import { emitOrderEvent } from '../../lib/socket.js';
import { enqueueNotification } from '../../lib/notifications.js';
import { getDispatchService } from '../../lib/dispatch.js';
import { publishEvent } from '../../lib/events.js';
import { ErpIntegrationService } from '../../lib/erpIntegration.js';
import { enqueueErpOrderSync } from '../../lib/erpSyncQueue.js';
import { creditDriverOnDelivery, getDriverJobs } from '../drivers/drivers.service.js';
import { AppError } from '../../middleware/errorHandler.js';

const DELIVERY_BASE_FEE = 50;
const DELIVERY_PER_KM = 25;
/** Flat surcharge added during lunch (12–14) and dinner (18–21) peak hours (Req 3.8) */
const PEAK_SURCHARGE = 30;
const PEAK_HOURS = [12, 13, 18, 19, 20];

function currentPeakSurcharge(at: Date = new Date()): number {
  return PEAK_HOURS.includes(at.getHours()) ? PEAK_SURCHARGE : 0;
}

/** Role → allowed status transitions from current status */
const VENDOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.pending]: [OrderStatus.confirmed, OrderStatus.cancelled],
  [OrderStatus.confirmed]: [OrderStatus.preparing, OrderStatus.cancelled],
  [OrderStatus.preparing]: [OrderStatus.ready, OrderStatus.cancelled],
};

const DRIVER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.ready]: [OrderStatus.picked_up],
  [OrderStatus.picked_up]: [OrderStatus.delivered],
};

const CUSTOMER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.pending]: [OrderStatus.cancelled],
  [OrderStatus.confirmed]: [OrderStatus.cancelled],
};

function calcDeliveryFee(
  vendorLat: number | null,
  vendorLng: number | null,
  addrLat: number | null | undefined,
  addrLng: number | null | undefined,
): number {
  if (
    vendorLat == null ||
    vendorLng == null ||
    addrLat == null ||
    addrLng == null ||
    Number.isNaN(Number(addrLat)) ||
    Number.isNaN(Number(addrLng))
  ) {
    return DELIVERY_BASE_FEE + DELIVERY_PER_KM * 3 + currentPeakSurcharge();
  }
  const km = haversineKm(Number(vendorLat), Number(vendorLng), Number(addrLat), Number(addrLng));
  return Math.round(DELIVERY_BASE_FEE + Math.max(0, km) * DELIVERY_PER_KM + currentPeakSurcharge());
}

export async function estimateDeliveryFee(
  vendorId: string,
  lat: number | null,
  lng: number | null,
) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  const fee = calcDeliveryFee(
    vendor.latitude != null ? Number(vendor.latitude) : null,
    vendor.longitude != null ? Number(vendor.longitude) : null,
    lat,
    lng,
  );
  let distanceKm: number | null = null;
  if (
    vendor.latitude != null &&
    vendor.longitude != null &&
    lat != null &&
    lng != null &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    distanceKm =
      Math.round(
        haversineKm(Number(vendor.latitude), Number(vendor.longitude), lat, lng) * 100,
      ) / 100;
  }
  return {
    deliveryFee: fee,
    distanceKm,
    baseFee: DELIVERY_BASE_FEE,
    perKmRate: DELIVERY_PER_KM,
    peakSurcharge: currentPeakSurcharge(),
  };
}

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
  if (!data.items?.length) {
    throw new AppError(400, 'Order must include at least one item');
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

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

  const productIds = data.items.map((i) => i.productId);
  const now = new Date();
  const flashSales = await prisma.flashSale.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      vendorId: data.vendorId,
      OR: [{ productId: { in: productIds } }, { productId: null }],
    },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, vendorId: data.vendorId },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const pricedItems = data.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new AppError(400, `Product ${item.productId} not found for vendor`);
    if (!product.isAvailable) throw new AppError(400, `${product.name} is unavailable`);
    if (product.stockQuantity < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${product.name}`);
    }

    const sale =
      flashSales.find((f) => f.productId === item.productId) ||
      flashSales.find((f) => f.productId == null);
    const unitPrice = sale
      ? Math.round(item.unitPrice * (1 - sale.discountPct / 100) * 100) / 100
      : item.unitPrice;
    return { ...item, unitPrice };
  });

  let finalDeliveryAddressId = data.deliveryAddressId;
  let deliveryAddress = finalDeliveryAddressId
    ? await prisma.address.findUnique({ where: { id: finalDeliveryAddressId } })
    : null;

  if (!finalDeliveryAddressId && data.deliveryAddress) {
    deliveryAddress = await prisma.address.create({
      data: {
        userId: data.customerId,
        label: 'home',
        addressLine: data.deliveryAddress,
      },
    });
    finalDeliveryAddressId = deliveryAddress.id;
  }

  const subtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const calculatedDeliveryFee = calcDeliveryFee(
    vendor.latitude != null ? Number(vendor.latitude) : null,
    vendor.longitude != null ? Number(vendor.longitude) : null,
    deliveryAddress?.latitude != null ? Number(deliveryAddress.latitude) : null,
    deliveryAddress?.longitude != null ? Number(deliveryAddress.longitude) : null,
  );
  const premium = await prisma.premiumSubscription.findFirst({
    where: { userId: data.customerId, status: 'active', OR: [{ cancelAt: null }, { cancelAt: { gt: new Date() } }] },
    select: { id: true },
  });
  const deliveryFee = premium ? 0 : calculatedDeliveryFee;
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of pricedItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
      if (updated.count === 0) {
        throw new AppError(400, 'Insufficient stock for one or more items');
      }
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product && product.stockQuantity <= 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { isAvailable: false },
        });
      }
    }

    return tx.order.create({
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
          create: pricedItems.map((item) => ({
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
            erpTenantId: true,
          },
        },
        customer: { select: { fullName: true, phone: true } },
      },
    });
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

  await enqueueNotification({
    userId: order.customerId,
    title: 'Order placed',
    body: `Your order ${order.orderNumber} was placed successfully`,
    type: 'order_placed',
    data: { orderId: order.id },
  });

  void publishEvent({
    type: 'order.created',
    orderId: order.id,
    vendorId: order.vendorId,
    customerId: order.customerId,
    totalAmount: Number(order.totalAmount),
  });

  // Req 10.1/10.2: push the order into the vendor's ERP right after creation.
  syncOrderToErpWithRetry(order.id);

  return order;
}

export interface CursorOptions {
  cursor?: string;
  limit?: number;
}

function cursorArgs(opts: CursorOptions): {
  take: number;
  limit: number;
  cursor?: { id: string };
  skip?: number;
} {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  return {
    take: limit + 1,
    limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  };
}

function paginate<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor };
}

export async function getOrdersByCustomer(customerId: string, opts: CursorOptions = {}) {
  const { take, cursor, skip, limit } = cursorArgs(opts);
  const rows = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor, skip } : {}),
    include: {
      items: { include: { product: true } },
      vendor: {
        select: { id: true, businessName: true, logoUrl: true },
      },
    },
  });
  return paginate(rows, limit);
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
          erpTenantId: true,
        },
      },
      deliveryAddress: true,
      driver: {
        select: { id: true, fullName: true, phone: true },
      },
    },
  });
}

export { getDriverJobs };

async function syncOrderToErpIfLinked(orderId: string, opts: { force?: boolean } = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      vendor: true,
      customer: { select: { fullName: true, phone: true } },
    },
  });
  if (!order) return { success: false, message: 'Order not found' };
  if (!opts.force && order.erpOrderId) {
    return { success: true, erpOrderId: order.erpOrderId, message: 'Already synced' };
  }

  const provider = order.vendor.erpProvider;
  if (provider === 'none' || !order.vendor.erpTenantId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        erpSyncStatus: 'skipped',
        erpSyncError: 'Vendor is not linked to an ERP tenant',
        erpSyncedAt: new Date(),
      },
    });
    return { success: false, message: 'Vendor not linked to ERP' };
  }
  if (provider === 'enterprise' && order.vendor.erpProvisionStatus !== 'provisioned') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        erpSyncStatus: 'failed',
        erpSyncError: 'Enterprise vendor is not provisioned yet',
        erpSyncedAt: new Date(),
      },
    });
    return { success: false, message: 'Enterprise vendor not provisioned' };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { erpSyncStatus: 'pending', erpSyncError: null },
  });

  const result = await ErpIntegrationService.syncOrderToErp({
    provider,
    vendorId: order.vendorId,
    erpTenantId: order.vendor.erpTenantId,
    marketplaceOrderId: order.id,
    marketplaceOrderNumber: order.orderNumber,
    totalAmount: Number(order.totalAmount),
    customerInfo: { name: order.customer.fullName, phone: order.customer.phone ?? undefined },
    items: order.items.map((i) => ({
      productId: i.productId,
      sku: i.product.sku ?? undefined,
      name: i.product.name,
      quantity: i.quantity,
      price: Number(i.unitPrice),
    })),
  });

  if (result.success && result.erpOrderId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        erpOrderId: String(result.erpOrderId).slice(0, 50),
        erpSyncStatus: 'synced',
        erpSyncError: null,
        erpSyncedAt: new Date(),
      },
    });
    return result;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      erpSyncStatus: 'failed',
      erpSyncError: (result.message || 'ERP sync failed').slice(0, 500),
      erpSyncedAt: new Date(),
    },
  });
  return result;
}

export { syncOrderToErpIfLinked };

/**
 * Fire-and-forget ERP sync with BullMQ retry (Req 10.6): try inline once,
 * and on a transient failure hand the order to the retry queue (1s/5s/30s).
 */
function syncOrderToErpWithRetry(orderId: string): void {
  void syncOrderToErpIfLinked(orderId)
    .then((result) => {
      if (!result.success && result.message !== 'Vendor not linked to ERP') {
        return enqueueErpOrderSync(orderId);
      }
      return undefined;
    })
    .catch((err) => {
      console.error('[orders] inline ERP sync errored, enqueueing retry:', err);
      return enqueueErpOrderSync(orderId);
    });
}

async function restoreStockForOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: { increment: item.quantity },
        isAvailable: true,
      },
    });
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actor?: { id: string; role: string },
) {
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { vendor: { select: { userId: true, businessName: true, erpTenantId: true } } },
  });
  if (!existing) throw new AppError(404, 'Order not found');

  if (actor) {
    const role = actor.role as UserRole | string;
    let allowed: OrderStatus[] = [];

    if (role === 'admin') {
      allowed = Object.values(OrderStatus);
    } else if (role === 'vendor') {
      if (existing.vendor.userId !== actor.id) throw new AppError(403, 'Access denied');
      allowed = VENDOR_TRANSITIONS[existing.status] ?? [];
    } else if (role === 'driver') {
      if (existing.driverId !== actor.id) throw new AppError(403, 'Access denied');
      allowed = DRIVER_TRANSITIONS[existing.status] ?? [];
    } else if (role === 'customer') {
      if (existing.customerId !== actor.id) throw new AppError(403, 'Access denied');
      allowed = CUSTOMER_TRANSITIONS[existing.status] ?? [];
    } else {
      throw new AppError(403, 'Access denied');
    }

    if (!allowed.includes(status)) {
      throw new AppError(
        400,
        `Cannot transition from ${existing.status} to ${status} as ${role}`,
      );
    }
  }

  if (status === OrderStatus.cancelled && existing.status !== OrderStatus.cancelled) {
    await restoreStockForOrder(id);
    // Initiate refund of any captured payment (Req 3.7); dynamic import avoids a module cycle
    const { refundOrderPayments } = await import('../payments/payments.service.js');
    void refundOrderPayments(id, 'Order cancelled').catch((err) =>
      console.error('[orders] refund on cancel failed:', err),
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      vendor: { select: { userId: true, businessName: true, erpTenantId: true, erpProvider: true } },
    },
  });

  emitOrderEvent(
    'order:status_update',
    [
      `order:${order.id}`,
      `customer:${order.customerId}`,
      `vendor:${order.vendorId}`,
      ...(order.driverId ? [`driver:${order.driverId}`] : []),
    ],
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    },
  );

  await enqueueNotification({
    userId: order.customerId,
    title: 'Order update',
    body: `Your order ${order.orderNumber} is now ${status.replace(/_/g, ' ')}`,
    type: 'order_status',
    data: { orderId: order.id, status },
  });

  void publishEvent({
    type: 'order.status_changed',
    orderId: order.id,
    status,
    customerId: order.customerId,
    vendorId: order.vendorId,
  });

  // When kitchen marks ready → start delivery dispatch (not on picked_up)
  if (status === OrderStatus.ready) {
    try {
      const dispatch = getDispatchService();
      await dispatch.dispatchOrder(order.id);
    } catch (err) {
      console.error('[orders] dispatch failed:', err);
    }
  }

  if (status === OrderStatus.confirmed || status === OrderStatus.preparing) {
    syncOrderToErpWithRetry(order.id);
  }

  if (status === OrderStatus.delivered) {
    if (order.driverId) {
      await creditDriverOnDelivery(order.driverId, Number(order.deliveryFee));
    }

    // ERP-origin orders: report delivery completion back to the vendor's ERP (Req 11.6)
    if (order.erpOrderId && order.vendor.erpTenantId) {
      void ErpIntegrationService.pushOrderStatusToErp({
        provider: order.vendor.erpProvider === 'enterprise' ? 'enterprise' : 'simple',
        erpTenantId: order.vendor.erpTenantId,
        erpOrderId: order.erpOrderId,
        marketplaceOrderId: order.id,
        status: 'delivered',
      }).catch(() => undefined);
    }

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
      void publishEvent({
        type: 'order.paid',
        orderId: order.id,
        vendorId: order.vendorId,
        erpTenantId: order.vendor.erpTenantId,
      });
      syncOrderToErpWithRetry(order.id);
    }
  }

  return order;
}

export async function cancelOrder(id: string, userId: string, role: string) {
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { vendor: { select: { userId: true } } },
  });
  if (!existing) throw new AppError(404, 'Order not found');

  const isOwner = existing.customerId === userId;
  const isVendor = role === 'vendor' && existing.vendor.userId === userId;
  const isAdmin = role === 'admin';
  if (!isOwner && !isVendor && !isAdmin) throw new AppError(403, 'Forbidden');

  return updateOrderStatus(id, OrderStatus.cancelled, { id: userId, role });
}

export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.paid },
    include: { vendor: true },
  });
  void publishEvent({
    type: 'order.paid',
    orderId: order.id,
    vendorId: order.vendorId,
    erpTenantId: order.vendor.erpTenantId,
  });
  syncOrderToErpWithRetry(order.id);
  return order;
}

export async function getVendorOrders(
  vendorId: string,
  status?: OrderStatus,
  opts: CursorOptions = {},
) {
  const { take, cursor, skip, limit } = cursorArgs(opts);
  const rows = await prisma.order.findMany({
    where: {
      vendorId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor, skip } : {}),
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
      deliveryAddress: true,
      driver: { select: { id: true, fullName: true, phone: true } },
    },
  });
  return paginate(rows, limit);
}

export async function getOrdersForVendorUser(userId: string, opts: CursorOptions = {}) {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) return { items: [], nextCursor: null };
  return getVendorOrders(vendor.id, undefined, opts);
}
