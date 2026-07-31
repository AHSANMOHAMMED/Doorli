import { prisma } from '@doorli/db';
import { publishEvent } from '../../lib/events.js';
import { AppError } from '../../middleware/errorHandler.js';
import { enqueueNotification } from '../../lib/notifications.js';
import { getRedis } from '../../lib/redis.js';

// ─── Cache TTL ────────────────────────────────────────────────────────────────
const PRODUCTS_CACHE_TTL_S = 60; // Req 9.4

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

// ─── Search re-index helper (Req 9.11) ───────────────────────────────────────

function triggerVendorSearchSync(vendorId: string): void {
  const searchUrl = process.env.SEARCH_SERVICE_URL || 'http://localhost:4004';
  fetch(`${searchUrl}/api/search/vendor-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId }),
  }).catch(() => {});
}

export async function getProductsByVendor(vendorId: string) {
  const cacheKey = `products:vendor:${vendorId}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const products = await prisma.product.findMany({
    where: { vendorId },
    orderBy: { name: 'asc' },
  });

  await cacheSet(cacheKey, products, PRODUCTS_CACHE_TTL_S);
  return products;
}

export async function getAllProducts(vendorId?: string) {
  const cacheKey = `products:list:${vendorId ?? 'all'}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const products = await prisma.product.findMany({
    where: vendorId ? { vendorId } : undefined,
    orderBy: { name: 'asc' },
  });

  await cacheSet(cacheKey, products, PRODUCTS_CACHE_TTL_S);
  return products;
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
  void cacheInvalidate(`products:*:${vendorId}`);
  triggerVendorSearchSync(product.vendorId);
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
  void cacheInvalidate(`products:*:${product.vendorId}`);
  triggerVendorSearchSync(product.vendorId);
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
  void cacheInvalidate(`products:*:${product.vendorId}`);
  triggerVendorSearchSync(product.vendorId);
  return product;
}

/**
 * PATCH /products/:id/toggle-available — flip isAvailable flag (Req 2.8).
 */
export async function toggleProductAvailable(id: string, userId: string, role: string) {
  await assertVendorOwnsProduct(id, userId, role);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, 'Product not found');

  const updated = await prisma.product.update({
    where: { id },
    data: { isAvailable: !product.isAvailable },
  });
  void publishEvent({
    type: 'product.changed',
    productId: updated.id,
    vendorId: updated.vendorId,
    action: 'updated',
  });
  void cacheInvalidate(`products:*:${updated.vendorId}`);
  triggerVendorSearchSync(updated.vendorId);
  return updated;
}

/**
 * POST /products/bulk-update-stock — batch stock update with low-stock alerts (Req 9.4, 9.11).
 * Runs all updates in a single Prisma transaction. After each update, if
 * stockQuantity <= lowStockAt, enqueues a low-stock notification for the vendor owner.
 */
export async function bulkUpdateStock(
  updates: Array<{ productId: string; stockQuantity: number }>,
  userId: string,
  role: string,
) {
  // Validate all products exist and caller has access
  const productIds = updates.map((u) => u.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { vendor: { select: { id: true, userId: true } } },
  });

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    throw new AppError(404, `Products not found: ${missing.join(', ')}`);
  }

  if (role !== 'admin') {
    const unauthorized = products.filter((p) => p.vendor.userId !== userId);
    if (unauthorized.length > 0) {
      throw new AppError(403, `Access denied for products: ${unauthorized.map((p) => p.id).join(', ')}`);
    }
  }

  // Build a map for quick access
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Execute all stock updates in a single transaction
  const updatedProducts = await prisma.$transaction(
    updates.map(({ productId, stockQuantity }) =>
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity },
      }),
    ),
  );

  // After transaction: check low-stock thresholds and enqueue notifications
  const vendorUserIds = new Set<string>();
  for (const updated of updatedProducts) {
    const original = productMap.get(updated.id);
    if (!original) continue;
    const threshold = updated.lowStockAt ?? original.lowStockAt ?? 5;
    if (updated.stockQuantity <= threshold) {
      const vendorUserId = original.vendor.userId;
      if (!vendorUserIds.has(vendorUserId)) {
        vendorUserIds.add(vendorUserId);
      }
      void enqueueNotification({
        userId: vendorUserId,
        title: 'Low Stock Alert',
        body: `Product "${updated.name}" is running low (${updated.stockQuantity} remaining).`,
        type: 'low_stock',
        data: {
          productId: updated.id,
          productName: updated.name,
          stockQuantity: updated.stockQuantity,
          threshold,
        },
        channels: ['in_app'],
      });
    }

    // Invalidate product cache and trigger search sync per vendor
    void cacheInvalidate(`products:*:${updated.vendorId}`);
    triggerVendorSearchSync(updated.vendorId);
  }

  return updatedProducts;
}
