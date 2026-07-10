import { prisma } from '@doorli/db';

export async function getAllVendors(category?: string) {
  const where = category ? { category: category as any } : {};
  return prisma.vendor.findMany({
    where,
    orderBy: { avgRating: 'desc' },
  });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({
    where: { id },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
  });
}

export async function createVendor(data: any) {
  return prisma.vendor.create({
    data,
  });
}

export async function updateVendor(id: string, data: any) {
  return prisma.vendor.update({
    where: { id },
    data,
  });
}
