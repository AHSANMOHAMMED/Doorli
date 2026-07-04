import { prisma } from '@doorli/db';
import { getRedis } from '../../lib/redis.js';
import { emitDriverEvent } from '../../lib/socket.js';
import type { UpdateLocationInput, ToggleOnlineInput } from './drivers.schema.js';

const LOCATION_THROTTLE_SEC = 5;
const DRIVER_EARNINGS_SHARE = 0.7;

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

export async function toggleOnline(userId: string, input: ToggleOnlineInput) {
  const driver = await getOrCreateDriver(userId);
  return prisma.driver.update({
    where: { id: driver.id },
    data: { isOnline: input.isOnline },
    select: driverSelect,
  });
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

  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
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

export async function getEarnings(userId: string) {
  const driver = await getOrCreateDriver(userId);
  return {
    earningsToday: Number(driver.earningsToday),
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

export { DRIVER_EARNINGS_SHARE };
