import { prisma, Prisma } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateVendorInput, UpdateVendorInput } from './vendors.schema.js';

const vendorSelect = {
  id: true,
  businessName: true,
  category: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  phone: true,
  addressLine: true,
  city: true,
  latitude: true,
  longitude: true,
  openingHours: true,
  isOpen: true,
  isVerified: true,
  avgRating: true,
  totalReviews: true,
  deliveryRadiusKm: true,
  minOrderAmount: true,
  createdAt: true,
};

export async function createVendor(userId: string, input: CreateVendorInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.role !== 'vendor' && user.role !== 'admin') {
    throw new AppError(403, 'Only vendor accounts can create a shop');
  }

  const existing = await prisma.vendor.findUnique({ where: { userId } });
  if (existing) throw new AppError(409, 'You already have a registered shop');

  return prisma.vendor.create({
    data: {
      userId,
      businessName: input.businessName,
      category: input.category,
      description: input.description,
      phone: input.phone ?? user.phone,
      addressLine: input.addressLine,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      deliveryRadiusKm: input.deliveryRadiusKm,
      minOrderAmount: input.minOrderAmount,
      openingHours: input.openingHours ?? Prisma.JsonNull,
      isOpen: true,
      isVerified: false,
    },
    select: vendorSelect,
  });
}

export async function updateVendor(vendorId: string, userId: string, input: UpdateVendorInput) {
  const vendor = await assertVendorOwner(vendorId, userId);

  return prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      ...input,
      openingHours: input.openingHours ?? undefined,
    },
    select: vendorSelect,
  });
}

export async function getVendorById(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      ...vendorSelect,
      products: {
        where: { isAvailable: true },
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          unit: true,
          imageUrl: true,
          category: true,
        },
        take: 50,
      },
    },
  });

  if (!vendor) throw new AppError(404, 'Vendor not found');
  return vendor;
}

export async function getMyVendor(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: {
      ...vendorSelect,
      _count: { select: { products: true, orders: true } },
    },
  });

  if (!vendor) throw new AppError(404, 'No shop registered for this account');
  return vendor;
}

export async function listVendors(params: {
  category?: string;
  page: number;
  pageSize: number;
}) {
  const where = params.category ? { category: params.category as never, isOpen: true } : { isOpen: true };

  const [items, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select: vendorSelect,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

export async function findNearbyVendors(params: {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
}) {
  const { lat, lng, radius, category } = params;

  type NearbyRow = {
    id: string;
    business_name: string;
    category: string;
    latitude: string;
    longitude: string;
    is_open: boolean;
    avg_rating: string;
    distance_km: number;
  };

  const categoryFilter = category
    ? Prisma.sql`AND category = ${category}::"VendorCategory"`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<NearbyRow[]>`
    SELECT * FROM (
      SELECT
        id,
        business_name,
        category,
        latitude,
        longitude,
        is_open,
        avg_rating,
        (
          6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${lat})) * cos(radians(latitude::float8))
              * cos(radians(longitude::float8) - radians(${lng}))
              + sin(radians(${lat})) * sin(radians(latitude::float8))
            ))
          )
        ) AS distance_km
      FROM vendors
      WHERE is_open = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        ${categoryFilter}
    ) nearby
    WHERE distance_km <= ${radius}
    ORDER BY distance_km ASC
    LIMIT 50
  `;

  return rows.map((row) => ({
    id: row.id,
    businessName: row.business_name,
    category: row.category,
    latitude: row.latitude,
    longitude: row.longitude,
    isOpen: row.is_open,
    avgRating: row.avg_rating,
    distanceKm: Number(row.distance_km.toFixed(2)),
  }));
}

export async function toggleVendorStatus(vendorId: string, userId: string) {
  const vendor = await assertVendorOwner(vendorId, userId);

  return prisma.vendor.update({
    where: { id: vendor.id },
    data: { isOpen: !vendor.isOpen },
    select: { id: true, isOpen: true },
  });
}

export async function getVendorProducts(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  return prisma.product.findMany({
    where: { vendorId },
    orderBy: { createdAt: 'desc' },
  });
}

async function assertVendorOwner(vendorId: string, userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  if (vendor.userId !== userId) throw new AppError(403, 'Not authorized to manage this shop');
  return vendor;
}

export { assertVendorOwner };
