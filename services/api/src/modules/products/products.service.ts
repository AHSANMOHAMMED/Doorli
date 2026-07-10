import { prisma } from '@doorli/db';

export async function getProductsByVendor(vendorId: string) {
  return prisma.product.findMany({
    where: { vendorId },
    orderBy: { name: 'asc' },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
  });
}

export async function createProduct(data: any) {
  return prisma.product.create({
    data,
  });
}

export async function updateProduct(id: string, data: any) {
  return prisma.product.update({
    where: { id },
    data,
  });
}
