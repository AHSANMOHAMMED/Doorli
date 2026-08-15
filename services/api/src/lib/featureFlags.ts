import { prisma } from '@doorli/db';
import { getRedis } from './redis.js';

/**
 * Feature-flag helpers shared by admin, vendor and ERP-webhook routes.
 *
 * Resolution order (matches services/auth featureAccess):
 *   explicit VendorFeature override > FeatureFlag.isGlobal default > disabled.
 */

export const MARKETPLACE_LISTING_KEY = 'marketplace_listing';
export const DOORLI_DELIVERY_KEY = 'doorli_delivery';
export const POS_KEY = 'pos';

/** Resolve whether a feature is enabled for a vendor (DB truth, no cache). */
export async function isFeatureEnabled(vendorId: string, featureKey: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: featureKey } });
  if (!flag) return false;
  const override = await prisma.vendorFeature.findUnique({
    where: { vendorId_featureId: { vendorId, featureId: flag.id } },
  });
  if (override) return override.isEnabled;
  return flag.isGlobal;
}

/** Resolve the complete feature catalog for client navigation and guards. */
export async function getVendorFeatureMap(vendorId: string): Promise<Record<string, boolean>> {
  const flags = await prisma.featureFlag.findMany({
    include: { vendorFeatures: { where: { vendorId }, select: { isEnabled: true } } },
  });
  return Object.fromEntries(flags.map((flag) => [
    flag.key,
    flag.vendorFeatures[0]?.isEnabled ?? flag.isGlobal,
  ]));
}

/** Drop the auth-service feature cache so toggles apply immediately (Req 11.7/18.4). */
export async function invalidateFeatureCache(vendorId: string): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') await redis.connect();
    await redis.del(`vendor_features:${vendorId}`);
  } catch {
    // tolerate cache unavailability — 60s TTL expires naturally
  }
}

/**
 * Upsert a VendorFeature override by flag key. Silently skips unknown flags so
 * provisioning still succeeds on a database that has not been seeded yet.
 */
export async function setVendorFeature(
  vendorId: string,
  featureKey: string,
  isEnabled: boolean,
): Promise<void> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: featureKey } });
  if (!flag) return;
  await prisma.vendorFeature.upsert({
    where: { vendorId_featureId: { vendorId, featureId: flag.id } },
    update: { isEnabled },
    create: { vendorId, featureId: flag.id, isEnabled },
  });
}

/**
 * Fire-and-forget Elasticsearch side-effect for `marketplace_listing` (Req 11.8):
 * asks the search service to index (enabled) or purge (disabled) the vendor's
 * product documents. Search downtime must never fail the toggle request.
 */
export function syncVendorMarketplaceIndex(vendorId: string, enabled: boolean): void {
  const base = (process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:4004').replace(/\/$/, '');
  void fetch(`${base}/api/search/vendor-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId, enabled }),
  }).catch(() => undefined);
}
