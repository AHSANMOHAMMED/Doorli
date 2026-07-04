import Redis from 'ioredis';
import { prisma } from '@doorli/db';
import { haversineKm } from '@doorli/utils';

export const OFFER_TTL_SEC = 30;
export const INITIAL_RADIUS_KM = 5;
export const EXPANDED_RADIUS_KM = 10;
export const MAX_ATTEMPTS_BEFORE_EXPAND = 3;
export const LOCATION_MAX_AGE_MS = 5 * 60 * 1000;

export interface JobOfferPayload {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffAddress: string | null;
  deliveryFee: number;
  expiresInSec: number;
}

export interface DispatchCallbacks {
  emitNewJob: (driverUserId: string, payload: JobOfferPayload) => void;
}

interface DispatchState {
  attemptCount: number;
  radiusKm: number;
  triedDriverIds: string[];
}

const offerKey = (orderId: string) => `dispatch:offer:${orderId}`;
const stateKey = (orderId: string) => `dispatch:state:${orderId}`;

export class DispatchService {
  private redis: Redis;
  private callbacks: DispatchCallbacks;
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(redisUrl: string, callbacks: DispatchCallbacks) {
    this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.callbacks = callbacks;
  }

  async connect(): Promise<boolean> {
    try {
      if (this.redis.status !== 'ready') await this.redis.connect();
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    this.retryTimers.clear();
    await this.redis.quit();
  }

  private async ensureRedis(): Promise<boolean> {
    try {
      if (this.redis.status !== 'ready') await this.redis.connect();
      return true;
    } catch {
      return false;
    }
  }

  private async getState(orderId: string): Promise<DispatchState> {
    const raw = await this.redis.get(stateKey(orderId));
    if (raw) return JSON.parse(raw) as DispatchState;
    return { attemptCount: 0, radiusKm: INITIAL_RADIUS_KM, triedDriverIds: [] };
  }

  private async saveState(orderId: string, state: DispatchState): Promise<void> {
    await this.redis.set(stateKey(orderId), JSON.stringify(state), 'EX', 3600);
  }

  private clearRetryTimer(orderId: string): void {
    const timer = this.retryTimers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(orderId);
    }
  }

  async dispatchOrder(orderId: string): Promise<void> {
    if (!(await this.ensureRedis())) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: { select: { businessName: true, latitude: true, longitude: true } },
        deliveryAddress: { select: { addressLine: true, latitude: true, longitude: true } },
      },
    });

    if (!order || order.status !== 'ready' || order.driverId || order.orderType !== 'delivery') {
      return;
    }

    const state = await this.getState(orderId);
    if (state.attemptCount >= MAX_ATTEMPTS_BEFORE_EXPAND && state.radiusKm < EXPANDED_RADIUS_KM) {
      state.radiusKm = EXPANDED_RADIUS_KM;
    }

    const pickupLat = order.vendor.latitude ? Number(order.vendor.latitude) : null;
    const pickupLng = order.vendor.longitude ? Number(order.vendor.longitude) : null;
    if (pickupLat == null || pickupLng == null) return;

    const minUpdated = new Date(Date.now() - LOCATION_MAX_AGE_MS);
    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        lastLocationUpdate: { gte: minUpdated },
        userId: { notIn: state.triedDriverIds },
      },
      select: {
        userId: true,
        currentLatitude: true,
        currentLongitude: true,
      },
    });

    const candidates = drivers
      .map((d) => ({
        userId: d.userId,
        distanceKm: haversineKm(
          pickupLat,
          pickupLng,
          Number(d.currentLatitude),
          Number(d.currentLongitude),
        ),
      }))
      .filter((d) => d.distanceKm <= state.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (candidates.length === 0) {
      state.attemptCount += 1;
      await this.saveState(orderId, state);
      if (state.attemptCount < MAX_ATTEMPTS_BEFORE_EXPAND * 2) {
        this.scheduleRetry(orderId, OFFER_TTL_SEC * 1000);
      }
      return;
    }

    const chosen = candidates[0];
    state.triedDriverIds.push(chosen.userId);
    state.attemptCount += 1;
    await this.saveState(orderId, state);

    await this.redis.set(
      offerKey(orderId),
      JSON.stringify({ driverUserId: chosen.userId }),
      'EX',
      OFFER_TTL_SEC,
    );

    const dropoffLat = order.deliveryAddress?.latitude
      ? Number(order.deliveryAddress.latitude)
      : null;
    const dropoffLng = order.deliveryAddress?.longitude
      ? Number(order.deliveryAddress.longitude)
      : null;

    const payload: JobOfferPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      vendorName: order.vendor.businessName,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      dropoffAddress: order.deliveryAddress?.addressLine ?? null,
      deliveryFee: Number(order.deliveryFee),
      expiresInSec: OFFER_TTL_SEC,
    };

    this.callbacks.emitNewJob(chosen.userId, payload);
    this.scheduleRetry(orderId, OFFER_TTL_SEC * 1000);
  }

  private scheduleRetry(orderId: string, delayMs: number): void {
    this.clearRetryTimer(orderId);
    const timer = setTimeout(() => {
      this.retryTimers.delete(orderId);
      void this.handleOfferExpired(orderId);
    }, delayMs);
    this.retryTimers.set(orderId, timer);
  }

  private async handleOfferExpired(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, driverId: true },
    });
    if (!order || order.driverId || order.status !== 'ready') {
      await this.clearDispatch(orderId);
      return;
    }
    const offer = await this.redis.get(offerKey(orderId));
    if (offer) {
      await this.redis.del(offerKey(orderId));
      await this.dispatchOrder(orderId);
    }
  }

  async validateOffer(orderId: string, driverUserId: string): Promise<boolean> {
    if (!(await this.ensureRedis())) return true;
    const raw = await this.redis.get(offerKey(orderId));
    if (!raw) return true;
    const offer = JSON.parse(raw) as { driverUserId: string };
    return offer.driverUserId === driverUserId;
  }

  async handleDecline(orderId: string, driverUserId: string): Promise<void> {
    if (!(await this.ensureRedis())) return;
    const raw = await this.redis.get(offerKey(orderId));
    if (!raw) return;
    const offer = JSON.parse(raw) as { driverUserId: string };
    if (offer.driverUserId !== driverUserId) return;

    this.clearRetryTimer(orderId);
    await this.redis.del(offerKey(orderId));

    const state = await this.getState(orderId);
    if (!state.triedDriverIds.includes(driverUserId)) {
      state.triedDriverIds.push(driverUserId);
      await this.saveState(orderId, state);
    }
    await this.dispatchOrder(orderId);
  }

  async clearDispatch(orderId: string): Promise<void> {
    this.clearRetryTimer(orderId);
    try {
      if (this.redis.status === 'ready') {
        await this.redis.del(offerKey(orderId), stateKey(orderId));
      }
    } catch {
      // ignore
    }
  }
}

export function createDispatchService(
  redisUrl: string,
  callbacks: DispatchCallbacks,
): DispatchService {
  return new DispatchService(redisUrl, callbacks);
}

export { DispatchService as default };
