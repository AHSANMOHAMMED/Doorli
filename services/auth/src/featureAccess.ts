import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type Redis from 'ioredis';
import type { PrismaClient } from '@doorli/db';

/**
 * Feature availability layer for the Auth Service.
 *
 * Resolution order for a vendor + feature key:
 *   1. Explicit VendorFeature row (admin/vendor override) — isEnabled wins
 *   2. FeatureFlag.isGlobal — global flags default to enabled for everyone
 *   3. Otherwise disabled
 *
 * Resolved feature maps are cached in Redis for a short TTL so hot paths
 * (every gated request) don't hit Postgres.
 */

const FEATURE_CACHE_TTL_SEC = 60;
const featureCacheKey = (vendorId: string) => `vendor_features:${vendorId}`;

type JwtUser = {
  id: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  jti?: string;
};

export function createFeatureAccess(deps: {
  prisma: PrismaClient;
  redis: Redis;
  jwtSecret: string;
}) {
  const { prisma, redis, jwtSecret } = deps;

  /** Build the effective key → boolean feature map for a vendor. */
  async function resolveFeatureMap(vendorId: string): Promise<Record<string, boolean>> {
    const cached = await redis.get(featureCacheKey(vendorId));
    if (cached) return JSON.parse(cached) as Record<string, boolean>;

    const [allFlags, overrides] = await Promise.all([
      prisma.featureFlag.findMany(),
      prisma.vendorFeature.findMany({ where: { vendorId }, include: { feature: true } }),
    ]);

    const map: Record<string, boolean> = {};
    for (const flag of allFlags) map[flag.key] = flag.isGlobal;
    for (const vf of overrides) map[vf.feature.key] = vf.isEnabled;

    await redis.set(
      featureCacheKey(vendorId),
      JSON.stringify(map),
      'EX',
      FEATURE_CACHE_TTL_SEC,
    );
    return map;
  }

  /** True if the feature is enabled for the vendor (override > global default). */
  async function hasFeature(vendorId: string, featureKey: string): Promise<boolean> {
    const map = await resolveFeatureMap(vendorId);
    return !!map[featureKey];
  }

  /** Drop the cached feature map — call after any toggle so changes apply immediately. */
  async function invalidateFeatureCache(vendorId: string): Promise<void> {
    await redis.del(featureCacheKey(vendorId));
  }

  /** Verify the Bearer access token and reject blacklisted JTIs. */
  async function authenticate(req: Request, res: Response): Promise<JwtUser | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthenticated', code: 'MISSING_TOKEN' });
      return null;
    }

    let payload: JwtUser;
    try {
      payload = jwt.verify(authHeader.slice(7).trim(), jwtSecret) as JwtUser;
    } catch (err) {
      const expired = err instanceof jwt.TokenExpiredError;
      res.status(401).json({
        error: expired ? 'Token expired' : 'Invalid token',
        code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      });
      return null;
    }

    if (payload.jti) {
      const blacklisted = await redis.get(`blacklist:${payload.jti}`);
      if (blacklisted) {
        res.status(401).json({ error: 'Token revoked', code: 'TOKEN_REVOKED' });
        return null;
      }
    }

    return payload;
  }

  /**
   * Middleware factory — gate a route behind a vendor feature flag.
   *
   * Usage:
   *   app.post('/some/pos/route', requireFeature('pos'), handler)
   *
   * Behaviour:
   *   401 — missing/invalid/revoked token
   *   403 VENDOR_PROFILE_REQUIRED — token holder has no vendor profile
   *   403 FEATURE_DISABLED — feature not enabled for this vendor
   *   Admins bypass feature checks.
   */
  function requireFeature(featureKey: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = await authenticate(req, res);
        if (!user) return;

        // Admins manage flags — never locked out by them
        if (user.role === 'admin') {
          (req as Request & { user?: JwtUser }).user = user;
          return next();
        }

        const vendor = await prisma.vendor.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!vendor) {
          res
            .status(403)
            .json({ error: 'Vendor profile required', code: 'VENDOR_PROFILE_REQUIRED' });
          return;
        }

        const isFeatureEnabled = await hasFeature(featureKey, vendor.id);
        if (!isFeatureEnabled) {
          res.status(403).json({
            error: `Feature '${featureKey}' is not enabled for this vendor`,
            code: 'FEATURE_DISABLED',
            feature: featureKey,
          });
          return;
        }

        (req as Request & { user?: JwtUser }).user = user;
        next();
      } catch (err) {
        console.error('[requireFeature]', err);
        res.status(500).json({ error: 'Internal server error.' });
      }
    };
  }

  return {
    requireFeature,
    hasFeature,
    resolveFeatureMap,
    invalidateFeatureCache,
    authenticate,
  };
}
