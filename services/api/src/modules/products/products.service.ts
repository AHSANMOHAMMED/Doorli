import { prisma } from '@doorli/db';
import { publishEvent } from '../../lib/events.js';
import { AppError } from '../../middleware/errorHandler.js';

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

async function assertVendorOwnsProduct(productId: string, userId: string, role: string) {
  if (role === 'admin') return;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { vendor: { select: { userId: true } } },
  });
  if (!product) throw new AppError(404, 'Product not found');
  if (product.vendor.userId !== userId) throw new AppError(403, 'Access denied');
}

async function assertVendorOwnsVendorId(vendorId: string, userId: string, role: string) {
  if (role === 'admin') return;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, 'Vendor not found');
  if (vendor.userId !== userId) throw new AppError(403, 'Access denied');
}

export async function createProduct(
  userId: string,
  role: string,
  data: Record<string, unknown>,
) {
  const vendorId = String(data.vendorId ?? '');
  if (!vendorId) throw new AppError(400, 'vendorId is required');
  await assertVendorOwnsVendorId(vendorId, userId, role);

  const product = await prisma.product.create({ data: data as never });
  void publishEvent({
    type: 'product.changed',
    productId: product.id,
    vendorId: product.vendorId,
    action: 'created',
  });
  void fetch(`${process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:4004'}/api/search/sync`, {
    method: 'POST',
  }).catch(() => undefined);
  return product;
}

export async function updateProduct(
  id: string,
  userId: string,
  role: string,
  data: Record<string, unknown>,
) {
  await assertVendorOwnsProduct(id, userId, role);
  const product = await prisma.product.update({ where: { id }, data: data as never });
  void publishEvent({
    type: 'product.changed',
    productId: product.id,
    vendorId: product.vendorId,
    action: 'updated',
  });
  void fetch(`${process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:4004'}/api/search/sync`, {
    method: 'POST',
  }).catch(() => undefined);
  return product;
}

export async function deleteProduct(id: string, userId: string, role: string) {
  await assertVendorOwnsProduct(id, userId, role);
  const product = await prisma.product.update({
    where: { id },
    data: { isAvailable: false },
  });
  void publishEvent({
    type: 'product.changed',
    productId: product.id,
    vendorId: product.vendorId,
    action: 'deleted',
  });
  return product;
}
