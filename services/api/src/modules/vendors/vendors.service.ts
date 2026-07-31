import { prisma, BookingStatus } from '@doorli/db';
import { haversineKm } from '@doorli/utils';
import { AppError } from '../../middleware/errorHandler.js';
import { getRedis } from '../../lib/redis.js';
import type { CreateVendorInput, UpdateVendorInput } from './vendors.schema.js';

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const NEARBY_CACHE_TTL_S = 60;   // Req 9.5
const VENDOR_CACHE_TTL_S = 120;  // Req 9.5

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Discovery visibility filter (Req 11.3/11.8): only vendors with the
 * `marketplace_listing` feature enabled appear in listings/nearby results.
 * Resolution: explicit VendorFeature override > FeatureFlag.isGlobal default.
 * Returns null when the flag isn't seeded yet — then no filtering applies.
 */
async function marketplaceListingWhere(): Promise<Record<string, unknown> | null> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: 'marketplace_listing' } });
  if (!flag) return null;
  if (flag.isGlobal) {
    // Enabled by default — hide only vendors that explicitly opted out
    return { features: { none: { featureId: flag.id, isEnabled: false } } };
  }
  // Opt-in flag — show only vendors explicitly granted the feature
  return { features: { some: { featureId: flag.id, isEnabled: true } } };
}

/**
 * Derive `isOpen` from the vendor's `openingHours` JSONB for the current
 * server time (Req 2.4). Falls back to the persisted `isOpen` flag when the
 * JSONB is absent or unparseable.
 *
 * openingHours shape: { monday: { open: "09:00", close: "21:00" }, ... }
 * Day keys (case-insensitive): sunday, monday, tuesday, wednesday, thursday, friday, saturday.
 */
function deriveIsOpen(vendor: { isOpen: boolean; openingHours: unknown }): boolean {
  if (!vendor.openingHours || typeof vendor.openingHours !== 'object') {
    return vendor.isOpen;
  }

  const hours = vendor.openingHours as Record<string, { open?: string; close?: string }>;
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = dayNames[now.getDay()];
  const todayHours = hours[dayKey] ?? hours[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];

  if (!todayHours?.open || !todayHours?.close) return vendor.isOpen;

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  return nowMins >= openMins && nowMins < closeMins;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // tolerate cache unavailability
  }
}

async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // tolerate cache unavailability
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getAllVendors(category?: string) {
  const where: Record<string, unknown> = { isVerified: true };
  if (category) where.category = category;
  const listingWhere = await marketplaceListingWhere();
  if (listingWhere) Object.assign(where, listingWhere);
  return prisma.vendor.findMany({
    where,
    orderBy: { avgRating: 'desc' },
  });
}

export async function getNearbyVendors(opts: {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
}) {
  // Build cache key from rounded coords (2 decimal places ≈ 1.1 km precision)
  const cacheKey = `nearby:${opts.lat.toFixed(2)}:${opts.lng.toFixed(2)}:${opts.radius}:${opts.category ?? 'all'}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = {
    isVerified: true,
    latitude: { not: null },
    longitude: { not: null },
  };
  if (opts.category) where.category = opts.category;
  const listingWhere = await marketplaceListingWhere();
  if (listingWhere) Object.assign(where, listingWhere);

  const vendors = await prisma.vendor.findMany({ where });

  const result = vendors
    .map((v) => {
      const distanceKm = haversineKm(
        opts.lat,
        opts.lng,
        Number(v.latitude),
        Number(v.longitude),
      );
      return {
        ...v,
        distanceKm: Math.round(distanceKm * 100) / 100,
        isOpen: deriveIsOpen(v),
      };
    })
    .filter((v) => v.distanceKm <= opts.radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  await cacheSet(cacheKey, result, NEARBY_CACHE_TTL_S);
  return result;
}

export async function getVendorByUserId(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
  });
}

export async function getVendorById(id: string) {
  const cacheKey = `vendor:${id}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
        take: 8, // products preview — first 8 (Req 2.4)
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { rating: true, comment: true, createdAt: true },
      },
    },
  });
  if (!vendor) return null;

  // Derive isOpen from openingHours JSONB (Req 2.4)
  const vendorWithIsOpen = {
    ...vendor,
    isOpen: deriveIsOpen(vendor),
    avgRating: vendor.avgRating,
  };

  // When vendor is linked to ERP, overlay live stock from ERP inventory (non-blocking fallback)
  if (vendor.erpTenantId && vendor.products.length > 0) {
    const { ErpIntegrationService } = await import('../../lib/erpIntegration.js');
    const enriched = await Promise.all(
      vendor.products.map(async (p) => {
        try {
          const inv = await ErpIntegrationService.getInventoryFromErp(
            vendor.erpTenantId as string,
            p.id,
          );
          if (!inv) return { ...p, erpSynced: false };
          const erpQty =
            typeof inv?.quantity === 'number'
              ? inv.quantity
              : typeof inv?.stock === 'number'
                ? inv.stock
                : typeof inv?.onHand === 'number'
                  ? inv.onHand
                  : null;
          if (erpQty === null) return { ...p, erpSynced: false };
          return {
            ...p,
            stockQuantity: erpQty,
            erpSynced: true,
            erpSource: 'inventory',
          };
        } catch {
          return { ...p, erpSynced: false };
        }
      }),
    );
    const result = { ...vendorWithIsOpen, products: enriched, erpLinked: true };
    await cacheSet(cacheKey, result, VENDOR_CACHE_TTL_S);
    return result;
  }

  const result = { ...vendorWithIsOpen, erpLinked: Boolean(vendor.erpTenantId) };
  await cacheSet(cacheKey, result, VENDOR_CACHE_TTL_S);
  return result;
}

/**
 * GET /vendors/:id/slots — available time slots for beauty/service vendors (Req 2.5).
 * Generates 30-minute slots within opening hours for the requested date and
 * subtracts confirmed/pending bookings.
 */
export async function getVendorSlots(vendorId: string, date: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  if (vendor.category !== 'beauty' && vendor.category !== 'service') {
    throw new AppError(400, 'Slots are only available for beauty and service vendors');
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) throw new AppError(400, 'Invalid date format');

  // Determine opening hours for this day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = dayNames[targetDate.getDay()];
  const hours = vendor.openingHours as Record<string, { open?: string; close?: string }> | null;
  const todayHours = hours?.[dayKey] ?? hours?.[dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];

  // Default to 9:00–18:00 if no opening hours set
  const openTime = todayHours?.open ?? '09:00';
  const closeTime = todayHours?.close ?? '18:00';

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  // Fetch confirmed/pending bookings for that date
  const eventDate = new Date(date);
  const bookedSlots = await prisma.booking.findMany({
    where: {
      vendorId,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      eventDate,
    },
    select: { startTime: true, endTime: true },
  });

  // Build 30-min slot intervals, subtracting booked ranges
  const SLOT_DURATION_MINS = 30;
  const slots: Array<{ start: string; end: string; available: boolean }> = [];

  for (let mins = openMins; mins + SLOT_DURATION_MINS <= closeMins; mins += SLOT_DURATION_MINS) {
    const slotStartH = Math.floor(mins / 60);
    const slotStartM = mins % 60;
    const slotEndH = Math.floor((mins + SLOT_DURATION_MINS) / 60);
    const slotEndM = (mins + SLOT_DURATION_MINS) % 60;

    const startStr = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`;
    const endStr = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`;

    // Check overlap with any booked slot
    const isBooked = bookedSlots.some((b) => {
      if (!b.startTime || !b.endTime) return false;
      const bookedStart = b.startTime.getHours() * 60 + b.startTime.getMinutes();
      const bookedEnd = b.endTime.getHours() * 60 + b.endTime.getMinutes();
      // Overlap if slot starts before booking ends AND slot ends after booking starts
      return mins < bookedEnd && mins + SLOT_DURATION_MINS > bookedStart;
    });

    slots.push({ start: startStr, end: endStr, available: !isBooked });
  }

  return { date, vendorId, slots };
}

/**
 * GET /vendors/:id/availability — blocked date ranges for hotel/hall vendors (Req 2.7).
 * Returns confirmed/pending bookings within the requested date range.
 */
export async function getVendorAvailability(vendorId: string, from: string, to: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  const bookings = await prisma.booking.findMany({
    where: {
      vendorId,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      OR: [
        {
          checkInDate: { lte: new Date(to) },
          checkOutDate: { gte: new Date(from) },
        },
        {
          eventDate: { gte: new Date(from), lte: new Date(to) },
        },
      ],
    },
    select: {
      id: true,
      checkInDate: true,
      checkOutDate: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      status: true,
      bookingType: true,
    },
  });

  return { vendorId, from, to, blockedDates: bookings };
}

export async function createVendor(userId: string, data: CreateVendorInput) {
  return prisma.vendor.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateVendor(id: string, userId: string, role: string, data: UpdateVendorInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  if (role !== 'admin' && vendor.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }
  const updated = await prisma.vendor.update({
    where: { id },
    data,
  });
  // Invalidate single-vendor cache on update
  await cacheInvalidate(`vendor:${id}`);
  return updated;
}

/**
 * PATCH /vendors/:id/toggle-status — flip isOpen flag (Req 2.3).
 * Only the owning vendor user or an admin may call this.
 */
export async function toggleVendorStatus(id: string, userId: string, role: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  if (role !== 'admin' && vendor.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }
  const updated = await prisma.vendor.update({
    where: { id },
    data: { isOpen: !vendor.isOpen },
  });
  // Invalidate caches
  await Promise.all([
    cacheInvalidate(`vendor:${id}`),
    cacheInvalidate('nearby:*'),
  ]);
  return updated;
}
