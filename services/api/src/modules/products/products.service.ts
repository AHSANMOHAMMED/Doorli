import { prisma } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { assertVendorOwner } from '../vendors/vendors.service.js';
import type { CreateProductInput, UpdateProductInput } from './products.schema.js';

const productSelect = {
  id: true,
  vendorId: true,
  name: true,
  description: true,
  category: true,
  price: true,
  discountPrice: true,
  unit: true,
  stockQuantity: true,
  imageUrl: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
};

async function getVendorForUser(userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new AppError(404, 'Register your shop before managing products');
  return vendor;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const vendor = await getVendorForUser(userId);

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      ...input,
      isAvailable: input.stockQuantity > 0 ? input.isAvailable : false,
    },
    select: productSelect,
  });

  return product;
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: productSelect,
  });
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

export async function updateProduct(productId: string, userId: string, input: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  await assertVendorOwner(product.vendorId, userId);

  const stockQuantity = input.stockQuantity ?? product.stockQuantity;
  const isAvailable =
    input.isAvailable !== undefined
      ? input.isAvailable && stockQuantity > 0
      : stockQuantity > 0
        ? product.isAvailable
        : false;

  return prisma.product.update({
    where: { id: productId },
    data: { ...input, isAvailable },
    select: productSelect,
  });
}

export async function deleteProduct(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  await assertVendorOwner(product.vendorId, userId);
  await prisma.product.delete({ where: { id: productId } });
  return { message: 'Product deleted' };
}

export async function toggleProductAvailability(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  await assertVendorOwner(product.vendorId, userId);

  if (product.stockQuantity <= 0 && !product.isAvailable) {
    throw new AppError(400, 'Cannot enable out-of-stock product — update stock first');
  }

  return prisma.product.update({
    where: { id: productId },
    data: { isAvailable: !product.isAvailable },
    select: productSelect,
  });
}

export async function bulkUpdateStock(
  userId: string,
  updates: { productId: string; stockQuantity: number }[],
) {
  const vendor = await getVendorForUser(userId);

  const productIds = updates.map((u) => u.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, vendorId: vendor.id },
  });

  if (products.length !== updates.length) {
    throw new AppError(400, 'One or more products not found or not owned by your shop');
  }

  const results = await prisma.$transaction(
    updates.map((u) =>
      prisma.product.update({
        where: { id: u.productId },
        data: {
          stockQuantity: u.stockQuantity,
          isAvailable: u.stockQuantity > 0 ? undefined : false,
        },
        select: productSelect,
      }),
    ),
  );

  return results;
}

export async function listMyProducts(userId: string) {
  const vendor = await getVendorForUser(userId);
  return prisma.product.findMany({
    where: { vendorId: vendor.id },
    select: productSelect,
    orderBy: { createdAt: 'desc' },
  });
}
