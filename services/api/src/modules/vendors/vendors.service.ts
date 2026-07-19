import { prisma } from '@doorli/db';
import { haversineKm } from '@doorli/utils';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateVendorInput, UpdateVendorInput } from './vendors.schema.js';

export async function getAllVendors(category?: string) {
  const where: Record<string, unknown> = { isVerified: true };
  if (category) where.category = category;
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
  const where: Record<string, unknown> = {
    isVerified: true,
    latitude: { not: null },
    longitude: { not: null },
  };
  if (opts.category) where.category = opts.category;

  const vendors = await prisma.vendor.findMany({ where });

  return vendors
    .map((v) => {
      const distanceKm = haversineKm(
        opts.lat,
        opts.lng,
        Number(v.latitude),
        Number(v.longitude),
      );
      return { ...v, distanceKm: Math.round(distanceKm * 100) / 100 };
    })
    .filter((v) => v.distanceKm <= opts.radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);
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
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!vendor) return null;

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
    return { ...vendor, products: enriched, erpLinked: true };
  }

  return { ...vendor, erpLinked: Boolean(vendor.erpTenantId) };
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
  return prisma.vendor.update({
    where: { id },
    data,
  });
}
