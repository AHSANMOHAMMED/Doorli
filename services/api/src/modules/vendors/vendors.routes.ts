import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  getNearbyVendors,
  getVendorByUserId,
  getVendorSlots,
  getVendorAvailability,
  toggleVendorStatus,
} from './vendors.service.js';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { createVendorSchema, nearbyVendorsSchema, updateVendorSchema } from './vendors.schema.js';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '@doorli/db';
import { z } from 'zod';
import {
  invalidateFeatureCache,
  getVendorFeatureMap,
  syncVendorMarketplaceIndex,
  MARKETPLACE_LISTING_KEY,
} from '../../lib/featureFlags.js';
import { Queue } from 'bullmq';

// Flags a vendor may toggle for themselves; everything else is admin-only.
const VENDOR_TOGGLEABLE_FEATURES = ['marketplace_listing', 'doorli_delivery', 'online_payment'] as const;

const toggleFeatureSchema = z.object({
  featureKey: z.enum(VENDOR_TOGGLEABLE_FEATURES),
  isEnabled: z.boolean(),
});

const router = Router();

router.get('/nearby', validateQuery(nearbyVendorsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius, category } = req.query as unknown as {
      lat: number;
      lng: number;
      radius: number;
      category?: string;
    };
    const vendors = await getNearbyVendors({ lat, lng, radius, category });
    res.json({ success: true, data: { items: vendors } });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const vendors = await getAllVendors(category as string | undefined);
    res.json({ success: true, data: { items: vendors } });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/me',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await getVendorByUserId(req.user.id);
      if (!vendor) {
        res.status(404).json({ success: false, error: 'Vendor profile not found' });
        return;
      }
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/me/features',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await getVendorByUserId(req.user.id);
      if (!vendor) {
        res.status(404).json({ success: false, error: 'Vendor profile not found' });
        return;
      }
      
      const vendorFeatures = await prisma.vendorFeature.findMany({
        where: { vendorId: vendor.id },
        include: { feature: true }
      });
      
      // Also get all global features that are not explicitly disabled for this vendor
      const globalFeatures = await prisma.featureFlag.findMany({
        where: { isGlobal: true }
      });

      // Full catalog so clients can render toggles for non-global (opt-in) flags too
      const allFeatures = await prisma.featureFlag.findMany();

      const features = await getVendorFeatureMap(vendor.id);
      res.json({
        success: true,
        data: {
          features,
          vendor: {
            id: vendor.id,
            businessName: vendor.businessName,
            erpProvider: vendor.erpProvider,
            erpTenantId: vendor.erpTenantId,
          },
          vendorFeatures,
          globalFeatures,
          allFeatures,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /vendors/me/features — vendor self-service feature toggle.
 * Restricted to VENDOR_TOGGLEABLE_FEATURES (Req 11.3/11.4: "Connect to Doorli
 * App" and "Doorli Delivery" are vendor-initiated); other flags stay admin-only
 * via PUT /admin/vendors/:id/features.
 */
router.patch(
  '/me/features',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await getVendorByUserId(req.user.id);
      if (!vendor) {
        res.status(404).json({ success: false, error: 'Vendor profile not found' });
        return;
      }

      const { featureKey, isEnabled } = toggleFeatureSchema.parse(req.body);

      const feature = await prisma.featureFlag.findUnique({ where: { key: featureKey } });
      if (!feature) {
        res.status(404).json({ success: false, error: `Unknown feature '${featureKey}'` });
        return;
      }

      const vendorFeature = await prisma.vendorFeature.upsert({
        where: { vendorId_featureId: { vendorId: vendor.id, featureId: feature.id } },
        update: { isEnabled },
        create: { vendorId: vendor.id, featureId: feature.id, isEnabled },
        include: { feature: true },
      });

      await invalidateFeatureCache(vendor.id);

      // marketplace_listing controls search visibility → mirror into Elasticsearch (Req 11.8)
      if (featureKey === MARKETPLACE_LISTING_KEY) {
        syncVendorMarketplaceIndex(vendor.id, isEnabled);
      }

      res.json({ success: true, data: vendorFeature });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(createVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await createVendor(req.user.id, req.body);
      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(updateVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await updateVendor(req.params.id as string, req.user.id, req.user.role, req.body);
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Slots & Availability (Req 2.5, 2.7) ─────────────────────────────────────

/**
 * GET /vendors/:id/slots?date=YYYY-MM-DD
 * Returns available 30-min time slots for beauty/service vendors (Req 2.5).
 */
router.get('/:id/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      res.status(400).json({ success: false, error: 'date query param is required (YYYY-MM-DD)' });
      return;
    }
    const result = await getVendorSlots(req.params.id as string, date);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vendors/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns blocked date ranges from confirmed/pending hotel/hall bookings (Req 2.7).
 */
router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    if (!from || !to) {
      res.status(400).json({ success: false, error: 'from and to query params are required (YYYY-MM-DD)' });
      return;
    }
    const result = await getVendorAvailability(req.params.id as string, from, to);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /vendors/:id/toggle-status
 * Flip isOpen boolean (vendor owner or admin only) (Req 2.3).
 * Invalidates Redis cache for the vendor and nearby results.
 */
router.patch(
  '/:id/toggle-status',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await toggleVendorStatus(req.params.id as string, req.user.id, req.user.role);
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

// ─── ERP provisioning (Req 9.7, 9.9, 10.8) ──────────────────────────────────

let erpProvisionQueue: Queue | null = null;

function getErpProvisionQueue(): Queue {
  if (!erpProvisionQueue) {
    erpProvisionQueue = new Queue('doorli-erp-provision', {
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        maxRetriesPerRequest: null,
      },
    });
  }
  return erpProvisionQueue;
}

/**
 * POST /vendors/:id/erp/provision
 *
 * - simple:     provision embedded ERP tenant synchronously → erpTenantId + erpProvisionStatus='provisioned'
 * - enterprise: enqueue BullMQ job, set erpProvisionStatus='pending'; worker provisions + notifies vendor
 *
 * Only the owning vendor user or an admin may call this.
 */
router.post(
  '/:id/erp/provision',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');

      const vendor = await prisma.vendor.findUnique({ where: { id: String(req.params.id) } });
      if (!vendor) throw new AppError(404, 'Vendor not found');

      // Only the vendor's own user or an admin may provision
      if (req.user.role !== 'admin' && vendor.userId !== req.user.id) {
        throw new AppError(403, 'Access denied');
      }

      if (vendor.erpProvider === 'simple') {
        // ── Embedded ERP: synchronous provision ─────────────────────────────
        const embeddedUrl = (
          process.env.ERP_EMBEDDED_URL ||
          process.env.ERP_API_URL ||
          'http://127.0.0.1:3010/api/internal'
        ).replace(/\/$/, '');

        const rawSecret = process.env.ERP_INTERNAL_SECRET;
        if (!rawSecret) {
          throw new AppError(500, 'ERP_INTERNAL_SECRET environment variable is required');
        }
        const secret = rawSecret.replace(
          /^Bearer\s+/i,
          '',
        );

        let tenantId: string | null = null;
        let provisionError: string | null = null;

        try {
          const response = await fetch(`${embeddedUrl}/tenants`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': secret,
            },
            body: JSON.stringify({
              vendorId: vendor.id,
              businessName: vendor.businessName,
              phone: vendor.phone,
            }),
            signal: AbortSignal.timeout(8000),
          });

          const body = await response.json().catch(() => ({})) as Record<string, unknown>;
          if (response.ok && (body.tenantId || body.id)) {
            tenantId = String(body.tenantId ?? body.id);
          } else {
            provisionError = String((body as any).error || `Embedded ERP returned ${response.status}`);
          }
        } catch (err) {
          provisionError = err instanceof Error ? err.message : 'Embedded ERP unreachable';
        }

        if (tenantId) {
          const updated = await prisma.vendor.update({
            where: { id: vendor.id },
            data: {
              erpTenantId: tenantId,
              erpProvisionStatus: 'provisioned',
              erpProvisionError: null,
            },
          });
          return res.json({ success: true, data: { erpTenantId: tenantId, erpProvisionStatus: updated.erpProvisionStatus } });
        } else {
          await prisma.vendor.update({
            where: { id: vendor.id },
            data: { erpProvisionStatus: 'failed', erpProvisionError: provisionError },
          });
          return res.status(502).json({ success: false, error: provisionError });
        }
      } else if (vendor.erpProvider === 'enterprise') {
        // ── Enterprise ERP: async via BullMQ ────────────────────────────────
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: { erpProvisionStatus: 'pending', erpProvisionError: null },
        });

        await getErpProvisionQueue().add(
          'provision-vendor',
          {
            vendorId: vendor.id,
            businessName: vendor.businessName,
            adminEmail: vendor.phone ?? undefined,
            phone: vendor.phone ?? undefined,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 500,
            removeOnFail: 1000,
          },
        );

        return res.json({
          success: true,
          data: { erpProvisionStatus: 'pending', message: 'Enterprise ERP provisioning enqueued' },
        });
      } else {
        // erpProvider === 'none' or unknown
        throw new AppError(400, `Vendor erpProvider is '${vendor.erpProvider}' — set it to 'simple' or 'enterprise' first`);
      }
    } catch (err) {
      next(err);
    }
  },
);

export default router;
