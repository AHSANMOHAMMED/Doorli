import { prisma } from '@doorli/db';
import { getRedis } from '../../lib/redis.js';
import { emitDriverEvent, emitOrderEvent } from '../../lib/socket.js';
import { getDispatchService } from '../../lib/dispatch.js';
import type { UpdateLocationInput, ToggleOnlineInput } from './drivers.schema.js';

const LOCATION_THROTTLE_SEC = 5;
const LOCATION_CACHE_TTL_SEC = 300;
const DRIVER_EARNINGS_SHARE = 0.7;

const locationCacheKey = (driverUserId: string) => `driver:location:${driverUserId}`;

const driverSelect = {
  id: true,
  userId: true,
  vehicleType: true,
  vehicleNumber: true,
  licenseNumber: true,
  isOnline: true,
  currentLatitude: true,
  currentLongitude: true,
  lastLocationUpdate: true,
  totalDeliveries: true,
  avgRating: true,
  earningsToday: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, fullName: true, phone: true } },
};

export async function getOrCreateDriver(userId: string) {
  let driver = await prisma.driver.findUnique({
    where: { userId },
    select: driverSelect,
  });

  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        userId,
        vehicleType: 'bike',
        isOnline: false,
      },
      select: driverSelect,
    });
  }

  return driver;
}

export async function getDriverProfile(userId: string) {
  return getOrCreateDriver(userId);
}

export async function setOnlineStatus(userId: string, isOnline: boolean) {
  const driver = await getOrCreateDriver(userId);
  return prisma.driver.update({
    where: { id: driver.id },
    data: { isOnline, lastLocationUpdate: new Date() },
    select: driverSelect,
  });
}

export async function toggleOnline(userId: string, input: ToggleOnlineInput) {
  return setOnlineStatus(userId, input.isOnline);
}

async function getActiveOrderForDriver(userId: string) {
  return prisma.order.findFirst({
    where: {
      driverId: userId,
      status: { in: ['ready', 'picked_up'] },
      orderType: 'delivery',
    },
    select: { id: true, customerId: true },
  });
}

export async function updateLocation(userId: string, input: UpdateLocationInput) {
  const driver = await getOrCreateDriver(userId);

  const updated = await prisma.driver.update({
    where: { id: driver.id },
    data: {
      currentLatitude: input.latitude,
      currentLongitude: input.longitude,
      lastLocationUpdate: new Date(),
    },
    select: driverSelect,
  });

  // Keep the PostGIS geography column in sync for radius queries (best-effort)
  await prisma
    .$executeRaw`UPDATE drivers SET location = ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography WHERE id = ${driver.id}::uuid`
    .catch(() => undefined);

  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();

    // Cache latest position for GET /orders/:id/track
    await redis.set(
      locationCacheKey(userId),
      JSON.stringify({
        lat: input.latitude,
        lng: input.longitude,
        updatedAt: new Date().toISOString(),
      }),
      'EX',
      LOCATION_CACHE_TTL_SEC,
    );

    const throttleKey = `dispatch:location:throttle:${userId}`;
    const allowed = await redis.set(throttleKey, '1', 'EX', LOCATION_THROTTLE_SEC, 'NX');
    if (allowed === 'OK') {
      const activeOrder = await getActiveOrderForDriver(userId);
      if (activeOrder) {
        emitDriverEvent(
          'driver:location_update',
          [`order:${activeOrder.id}`, `customer:${activeOrder.customerId}`],
          {
            driverId: userId,
            orderId: activeOrder.id,
            lat: input.latitude,
            lng: input.longitude,
          },
        );
      }
    }
  } catch {
    // Redis optional for location broadcast
  }

  return updated;
}

export async function getCachedDriverLocation(
  driverUserId: string,
): Promise<{ lat: number; lng: number; updatedAt: string } | null> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
    const raw = await redis.get(locationCacheKey(driverUserId));
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to DB
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: driverUserId },
    select: { currentLatitude: true, currentLongitude: true, lastLocationUpdate: true },
  });
  if (!driver || driver.currentLatitude == null || driver.currentLongitude == null) return null;
  return {
    lat: Number(driver.currentLatitude),
    lng: Number(driver.currentLongitude),
    updatedAt: (driver.lastLocationUpdate ?? new Date(0)).toISOString(),
  };
}

export async function getEarnings(userId: string) {
  const driver = await getOrCreateDriver(userId);

  // Aggregate week/month from completed deliveries (driver keeps a share of each fee)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Monday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sumSince = async (since: Date) => {
    const agg = await prisma.order.aggregate({
      where: {
        driverId: userId,
        status: 'delivered',
        updatedAt: { gte: since },
      },
      _sum: { deliveryFee: true },
      _count: true,
    });
    return {
      earnings: Math.round(Number(agg._sum.deliveryFee ?? 0) * DRIVER_EARNINGS_SHARE * 100) / 100,
      deliveries: agg._count,
    };
  };

  const [week, month] = await Promise.all([sumSince(startOfWeek), sumSince(startOfMonth)]);

  return {
    earningsToday: Number(driver.earningsToday),
    earningsWeek: week.earnings,
    earningsMonth: month.earnings,
    deliveriesWeek: week.deliveries,
    deliveriesMonth: month.deliveries,
    totalDeliveries: driver.totalDeliveries,
    avgRating: Number(driver.avgRating),
  };
}

export async function creditDriverOnDelivery(userId: string, deliveryFee: number) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) return;

  const earning = deliveryFee * DRIVER_EARNINGS_SHARE;
  await prisma.driver.update({
    where: { id: driver.id },
    data: {
      totalDeliveries: { increment: 1 },
      earningsToday: { increment: earning },
    },
  });
}

const jobInclude = {
  items: { include: { product: true } },
  vendor: {
    select: {
      id: true,
      businessName: true,
      addressLine: true,
      latitude: true,
      longitude: true,
      phone: true,
    },
  },
  deliveryAddress: true,
  customer: { select: { id: true, fullName: true, phone: true } },
} as const;

export async function getDriverJobs(driverUserId: string) {
  const [active, available] = await Promise.all([
    prisma.order.findMany({
      where: {
        driverId: driverUserId,
        status: { in: ['ready', 'picked_up'] },
        orderType: 'delivery',
      },
      orderBy: { createdAt: 'desc' },
      include: jobInclude,
    }),
    prisma.order.findMany({
      where: {
        driverId: null,
        status: 'ready',
        orderType: 'delivery',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: jobInclude,
    }),
  ]);

  return { available, active };
}

export async function acceptDelivery(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { vendor: { select: { userId: true, businessName: true } } },
  });

  if (!order) throw new Error('Order not found');
  if (order.orderType !== 'delivery') throw new Error('Not a delivery order');
  if (order.status !== 'ready') throw new Error(`Cannot accept order in status ${order.status}`);
  if (order.driverId && order.driverId !== driverUserId) {
    throw new Error('Order already assigned to another driver');
  }

  await getOrCreateDriver(driverUserId);

  const dispatch = getDispatchService();
  const offerOk = await dispatch.validateOffer(orderId, driverUserId);
  if (!offerOk && !order.driverId) {
    throw new Error('This job is offered to another driver');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { driverId: driverUserId },
    include: {
      vendor: { select: { userId: true, businessName: true } },
      customer: { select: { fullName: true, phone: true } },
      deliveryAddress: true,
    },
  });

  await dispatch.clearDispatch(orderId);

  emitOrderEvent(
    'order:status_update',
    [`order:${updated.id}`, `customer:${updated.customerId}`, `vendor:${updated.vendorId}`, `driver:${driverUserId}`],
    {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      driverId: driverUserId,
    },
  );

  return updated;
}

export async function declineDelivery(orderId: string, driverUserId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.driverId === driverUserId) {
    throw new Error('Cannot decline an accepted delivery');
  }

  const dispatch = getDispatchService();
  await dispatch.handleDecline(orderId, driverUserId);
  return { orderId, declined: true };
}

export { DRIVER_EARNINGS_SHARE };
