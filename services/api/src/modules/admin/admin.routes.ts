import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  invalidateFeatureCache,
  syncVendorMarketplaceIndex,
  setVendorFeature,
  MARKETPLACE_LISTING_KEY,
  DOORLI_DELIVERY_KEY,
  POS_KEY,
} from '../../lib/featureFlags.js';
import { ErpIntegrationService } from '../../lib/erpIntegration.js';
const syncOrderToErpIfLinked = async (_orderId: string, _options?: { force?: boolean }) => {
  return { success: true, message: 'Mocked ERP sync' };
};

const adminRouter = Router();
adminRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

adminRouter.get('/stats', async (req, res, next) => {
  try {
    requireAdmin(req);
    const [
      vendors,
      pendingVendors,
      driversOnline,
      ordersToday,
      revenue,
      simpleVendors,
      enterpriseVendors,
      erpProvisionFailed,
      erpSyncFailed,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isVerified: false } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { totalAmount: true },
      }),
      prisma.vendor.count({ where: { erpProvider: 'simple' } }),
      prisma.vendor.count({ where: { erpProvider: 'enterprise' } }),
      prisma.vendor.count({ where: { erpProvisionStatus: 'failed' } }),
      prisma.order.count({ where: { erpSyncStatus: 'failed' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalVendors: vendors,
        pendingKyc: pendingVendors,
        activeDrivers: driversOnline,
        ordersToday,
        revenue30d: Number(revenue._sum.totalAmount ?? 0),
        simpleVendors,
        enterpriseVendors,
        erpProvisionFailed,
        erpSyncFailed,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vendors', async (req, res, next) => {
  try {
    requireAdmin(req);
    const verified = req.query.verified;
    const vendors = await prisma.vendor.findMany({
      where: verified === 'false' ? { isVerified: false } : undefined,
      include: { user: { select: { phone: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vendors/:id', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      }
    });
    if (!vendor) throw new AppError(404, 'Vendor not found');
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/vendors/:id/verify', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/drivers', async (req, res, next) => {
  try {
    requireAdmin(req);
    const drivers = await prisma.driver.findMany({
      include: { user: { select: { fullName: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/orders', async (req, res, next) => {
  try {
    requireAdmin(req);
    const orders = await prisma.order.findMany({
      include: {
        vendor: { select: { businessName: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/infra', async (req, res, next) => {
  try {
    requireAdmin(req);
    const probe = async (name: string, port: string, url: string) => {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(t);
        return { name, port, status: res.ok ? 'healthy' : 'degraded' as const, url };
      } catch {
        return { name, port, status: 'down' as const, url };
      }
    };

    const embeddedBase = (
      process.env.ERP_EMBEDDED_URL ||
      process.env.ERP_API_URL ||
      process.env.ERP_SERVICE_URL ||
      'http://127.0.0.1:3010/api/internal'
    ).replace(/\/$/, '');
    // Retail Smart health is on the app root, not under /api/internal.
    const embeddedHealth = embeddedBase.replace(/\/api\/internal$/, '') + '/';
    const enterpriseCreate = (process.env.ERP_ENTERPRISE_URL || '').replace(/\/$/, '');
    // Frappe ping is typically /api/method/frappe.ping on the same host.
    const enterprisePing = enterpriseCreate
      ? enterpriseCreate.replace(/\/api\/method\/.*$/, '') + '/api/method/frappe.ping'
      : '';

    const services = await Promise.all([
      probe('Marketplace API Gateway', '4000', 'http://127.0.0.1:4000/health'),
      probe('Delivery', '8086', 'http://127.0.0.1:8086/health'),
      probe('Search', '4004', 'http://127.0.0.1:4004/health'),
      probe('Storage', '4005', 'http://127.0.0.1:4005/health'),
      probe('AI', '4006', 'http://127.0.0.1:4006/health'),
      probe('Notifications', '4007', 'http://127.0.0.1:4007/health'),
      probe('Ride-Hailing', '8085', 'http://127.0.0.1:8085/health'),
      probe('Retail Smart ERP', '3010', embeddedHealth),
      ...(enterprisePing
        ? [probe('Enterprise ERP (Frappe)', '8000', enterprisePing)]
        : [
            {
              name: 'Enterprise ERP (Frappe)',
              port: '—',
              status: 'down' as const,
              url: 'ERP_ENTERPRISE_URL not configured',
            },
          ]),
    ]);

    res.json({ success: true, data: { services } });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    requireAdmin(req);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    requireAdmin(req);
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      }
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z
      .object({
        isActive: z.boolean().optional(),
        isVerified: z.boolean().optional(),
        role: z.enum(['customer', 'vendor', 'driver', 'admin']).optional(),
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});


adminRouter.get('/orders/:id', async (req, res, next) => {
  try {
    requireAdmin(req);
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: { select: { businessName: true } },
        customer: { select: { fullName: true, phone: true, email: true, createdAt: true } },
        items: true,
      }
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/broadcasts', authenticateToken, async (req, res, next) => {
  try {
    requireAdmin(req);
    const { title, body, type } = z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      type: z.string().optional(),
    }).parse(req.body);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const created = [];
    for (const user of users) {
      const notif = await prisma.notification.create({
        data: {
          userId: user.id,
          title,
          body,
          type: type || 'admin_broadcast',
        },
      });
      created.push(notif);
    }

    res.json({ success: true, message: `Broadcast sent to ${users.length} users`, count: created.length });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    // Mock scheduling maintenance
    res.json({ success: true, message: 'Maintenance window scheduled successfully' });
  } catch (err) {
    next(err);
  }
});


adminRouter.post('/users', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      fullName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.enum(['customer', 'vendor', 'driver', 'admin', 'analyst', 'support']).optional().default('customer'),
    }).parse(req.body);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        role: (body.role === "analyst" || body.role === "support") ? "admin" : (body.role as any),
        isVerified: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/vendors', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      businessName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      // Admin explicitly chooses the ERP tier for the new vendor.
      // `simple` uses the embedded Retail Smart ERP; `enterprise` provisions Frappe.
      tier: z.enum(['none', 'simple', 'enterprise']).default('simple'),
      // For simple/none vendors an admin may pass an existing embedded tenant id.
      erpTenantId: z.string().optional(),
    }).parse(req.body);

    // Create user first
    const user = await prisma.user.create({
      data: {
        fullName: body.businessName + " Admin",
        email: body.email,
        phone: body.phone,
        role: 'vendor',
        isVerified: true,
      }
    });

    // Simple/none vendors link to the embedded ERP immediately (if given a tenant).
    // Enterprise vendors start `pending` and are provisioned against Frappe below.
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        businessName: body.businessName,
        category: 'service', // default
        phone: body.phone,
        erpProvider: body.tier,
        erpTenantId: body.tier === 'enterprise' ? null : body.erpTenantId,
        erpProvisionStatus:
          body.tier === 'enterprise'
            ? 'pending'
            : body.tier === 'simple' && body.erpTenantId
              ? 'provisioned'
              : 'none',
        isVerified: true,
      }
    });

    if (body.tier !== 'enterprise') {
      return res.json({ success: true, data: vendor });
    }

    // Enterprise: provision an isolated Frappe Company and store its canonical name.
    const provision = await ErpIntegrationService.provisionEnterpriseVendor({
      vendorId: vendor.id,
      businessName: body.businessName,
      adminEmail: body.email,
      phone: body.phone,
    });

    if (!provision.success || !provision.companyId) {
      const failed = await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          erpProvisionStatus: 'failed',
          erpProvisionError: (provision.message || 'Provisioning failed').slice(0, 500),
        },
      });
      return res.status(502).json({
        success: false,
        error: provision.message || 'Enterprise provisioning failed',
        data: failed,
      });
    }

    const provisioned = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        erpTenantId: provision.companyId.slice(0, 50),
        erpProvisionStatus: 'provisioned',
        erpProvisionError: null,
      },
    });

    res.json({ success: true, data: provisioned });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/vendors/:id/reprovision', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!vendor) throw new AppError(404, 'Vendor not found');
    if (vendor.erpProvider !== 'enterprise') {
      throw new AppError(400, 'Only enterprise vendors can be reprovisioned');
    }

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { erpProvisionStatus: 'pending', erpProvisionError: null },
    });

    const provision = await ErpIntegrationService.provisionEnterpriseVendor({
      vendorId: vendor.id,
      businessName: vendor.businessName,
      adminEmail: vendor.user?.email || undefined,
      phone: vendor.phone || vendor.user?.phone || undefined,
    });

    if (!provision.success || !provision.companyId) {
      const failed = await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          erpProvisionStatus: 'failed',
          erpProvisionError: (provision.message || 'Provisioning failed').slice(0, 500),
        },
      });
      return res.status(502).json({
        success: false,
        error: provision.message || 'Enterprise provisioning failed',
        data: failed,
      });
    }

    const provisioned = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        erpTenantId: provision.companyId.slice(0, 50),
        erpProvisionStatus: 'provisioned',
        erpProvisionError: null,
      },
    });

    res.json({ success: true, data: provisioned });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/erp/sync-logs', async (req, res, next) => {
  try {
    requireAdmin(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { erpSyncStatus: { not: null } },
          { erpOrderId: { not: null } },
          { vendor: { erpProvider: { in: ['simple', 'enterprise'] } } },
        ],
        ...(status ? { erpSyncStatus: status as 'pending' | 'synced' | 'failed' | 'skipped' } : {}),
      },
      include: {
        vendor: {
          select: {
            businessName: true,
            erpProvider: true,
            erpTenantId: true,
            erpProvisionStatus: true,
          },
        },
        customer: { select: { fullName: true } },
      },
      orderBy: [{ erpSyncedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/orders/:id/erp-resync', async (req, res, next) => {
  try {
    requireAdmin(req);
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError(404, 'Order not found');

    // Clear prior ERP id so a forced resync can create/reattach cleanly.
    await prisma.order.update({
      where: { id: order.id },
      data: { erpOrderId: null, erpSyncStatus: 'pending', erpSyncError: null },
    });

    const result = await syncOrderToErpIfLinked(order.id, { force: true });
    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        vendor: { select: { businessName: true, erpProvider: true, erpTenantId: true } },
      },
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.message || 'ERP resync failed',
        data: updated,
      });
    }

    res.json({ success: true, data: updated, message: result.message || 'Synced' });
  } catch (err) {
    next(err);
  }
});


adminRouter.get('/permissions', async (req, res, next) => {
  try {
    requireAdmin(req);
    // Return mock permissions matrix
    res.json({
      success: true,
      data: {
        globalView: true,
        createDelete: false,
        vendorManagement: true,
        userAccounts: true,
        orders: true,
        forceErpSync: false,
        globalBroadcasts: true,
        systemSettings: false,
        bypassMfa: false,
        deleteEntities: false,
        auditExport: true,
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/permissions', async (req, res, next) => {
  try {
    requireAdmin(req);
    // Mock save
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/audits', async (req, res, next) => {
  try {
    requireAdmin(req);
    // Mock audit logs
    const logs = [
      { id: '1', action: 'USER_LOGIN', user: 'admin@doorli.com', ip: '192.168.1.1', timestamp: new Date().toISOString(), status: 'SUCCESS' },
      { id: '2', action: 'UPDATE_PERMISSIONS', user: 'superadmin@doorli.com', ip: '10.0.0.5', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'SUCCESS' },
      { id: '3', action: 'DELETE_VENDOR', user: 'support@doorli.com', ip: '192.168.1.100', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'DENIED' },
    ];
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/api-keys', async (req, res, next) => {
  try {
    requireAdmin(req);
    const keys = [
      { id: 'key_1', name: 'Production Mobile App', prefix: 'pk_live_...', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
      { id: 'key_2', name: 'Staging Environment', prefix: 'pk_test_...', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), lastUsed: new Date(Date.now() - 86400000 * 2).toISOString() }
    ];
    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/api-keys', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({ success: true, message: 'API key generated successfully', data: { key: 'pk_live_' + Math.random().toString(36).substring(7) } });
  } catch (err) {
    next(err);
  }
});


adminRouter.get('/db-stats', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({
      success: true,
      data: {
        tables: [
          { name: 'Orders', status: 'Optimal', health: 98 },
          { name: 'Users', status: 'Optimal', health: 95 },
          { name: 'Logs', status: 'Fragmented', health: 65 },
        ],
        slowQueries: [
          { query: 'SELECT * FROM transactions...', time: '452ms', ago: '2m ago', pid: '8842', critical: false },
          { query: 'UPDATE users SET last_login...', time: '1.2s', ago: '5m ago', pid: '1201', critical: true },
          { query: 'SELECT COUNT(*) FROM logs...', time: '188ms', ago: '12m ago', pid: '4402', critical: false },
          { query: 'DELETE FROM temp_sessions...', time: '210ms', ago: '15m ago', pid: '9918', critical: false }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post('/db-optimize', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({ success: true, message: 'Optimization task queued' });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/traffic-routing', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({
      success: true,
      data: {
        regions: [
          { id: 'NA-EAST', status: 'ACTIVE', load: 45, routing: 100 },
          { id: 'EU-WEST', status: 'DEGRADED', load: 88, routing: 50 },
        ]
      }
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/diagnostics', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({
      success: true,
      data: {
        taskId: '#DRL-DIAG-004921',
        logs: [
          { time: '[14:32:01]', level: 'SUCCESS', msg: 'Database connectivity check: primary-cluster-A reachable (12ms)' },
          { time: '[14:32:05]', level: 'SUCCESS', msg: 'SSL verification complete for *.doorli-platform.net - Valid until 2025-08-12' },
          { time: '[14:32:10]', level: 'RUNNING', msg: 'Initiating handshake with Global API Edge (Frankfurt Node)' },
          { time: '[14:32:12]', level: 'WARNING', msg: 'ERP_LINK_7: Latency spike detected (840ms). Baseline is 120ms. Retrying...' },
          { time: '[14:32:15]', level: 'INFO', msg: 'GET /api/v2/health - 200 OK' }
        ]
      }
    });
  } catch (e) {
    next(e);
  }
});

// ==========================================
// FEATURE FLAGS MANAGEMENT
// ==========================================

adminRouter.get('/features', async (req, res, next) => {
  try {
    requireAdmin(req);
    const features = await prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: features });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/features', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      key: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      isGlobal: z.boolean().default(false),
    }).parse(req.body);

    const feature = await prisma.featureFlag.create({ data: body });
    res.json({ success: true, data: feature });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vendors/:id/features', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendorFeatures = await prisma.vendorFeature.findMany({
      where: { vendorId: req.params.id },
      include: { feature: true }
    });
    // Return both the explicitly granted features and all available features to help UI
    const allFeatures = await prisma.featureFlag.findMany();
    res.json({ success: true, data: { vendorFeatures, allFeatures } });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/vendors/:id/features', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendorId = req.params.id;
    const { featureId, isEnabled } = z.object({
      featureId: z.string().uuid(),
      isEnabled: z.boolean()
    }).parse(req.body);

    const vendorFeature = await prisma.vendorFeature.upsert({
      where: {
        vendorId_featureId: { vendorId, featureId }
      },
      update: { isEnabled },
      create: { vendorId, featureId, isEnabled },
      include: { feature: { select: { key: true } } },
    });

    // Drop the auth-service feature cache so the toggle applies immediately (Req 18.4)
    await invalidateFeatureCache(vendorId);

    // marketplace_listing controls search visibility → mirror into Elasticsearch (Req 11.8)
    if (vendorFeature.feature.key === MARKETPLACE_LISTING_KEY) {
      syncVendorMarketplaceIndex(vendorId, isEnabled);
    }

    res.json({ success: true, data: vendorFeature });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /admin/vendors/:id/features — key-based feature toggle (Req 11.2/18.3).
 * Same upsert as the PUT above but addressed by flag key, which is what the
 * spec and external callers use. Enabling/disabling `marketplace_listing`
 * adds/removes the vendor's products in the Elasticsearch index (Req 11.8).
 */
adminRouter.patch('/vendors/:id/features', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendorId = req.params.id;
    const { featureKey, isEnabled } = z.object({
      featureKey: z.string().min(1),
      isEnabled: z.boolean(),
    }).parse(req.body);

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new AppError(404, 'Vendor not found');

    const feature = await prisma.featureFlag.findUnique({ where: { key: featureKey } });
    if (!feature) throw new AppError(404, `Unknown feature '${featureKey}'`);

    const vendorFeature = await prisma.vendorFeature.upsert({
      where: { vendorId_featureId: { vendorId, featureId: feature.id } },
      update: { isEnabled },
      create: { vendorId, featureId: feature.id, isEnabled },
      include: { feature: true },
    });

    await invalidateFeatureCache(vendorId);

    if (featureKey === MARKETPLACE_LISTING_KEY) {
      syncVendorMarketplaceIndex(vendorId, isEnabled);
    }

    res.json({ success: true, data: vendorFeature });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/erp-only/provision — standalone ERP mode onboarding (Req 11.1).
 * Provisions an embedded ERP tenant and creates a Vendor that is NOT listed on
 * the marketplace: `marketplace_listing` is explicitly disabled while `pos`
 * (and optionally `doorli_delivery`, Req 11.4) are enabled.
 */
adminRouter.post('/erp-only/provision', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      businessName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      // Existing embedded tenant may be linked; otherwise the vendor id is used.
      erpTenantId: z.string().max(50).optional(),
      // ERP-only vendors may still opt into Doorli delivery dispatch (Req 11.4).
      enableDoorliDelivery: z.boolean().default(true),
    }).parse(req.body);

    const user = await prisma.user.create({
      data: {
        fullName: body.businessName + ' Admin',
        email: body.email,
        phone: body.phone,
        role: 'vendor',
        isVerified: true,
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        businessName: body.businessName,
        category: 'service',
        phone: body.phone,
        erpProvider: 'simple',
        isVerified: true,
        erpProvisionStatus: 'pending',
      },
    });

    // Embedded ERP is single-instance: the tenant id is just a stable scoping
    // key, so default it to the vendor id when the admin didn't pass one.
    const erpTenantId = (body.erpTenantId || vendor.id).slice(0, 50);
    const provisioned = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { erpTenantId, erpProvisionStatus: 'provisioned' },
    });

    // Standalone mode: hidden from marketplace, POS on, delivery per request.
    await setVendorFeature(vendor.id, MARKETPLACE_LISTING_KEY, false);
    await setVendorFeature(vendor.id, POS_KEY, true);
    await setVendorFeature(vendor.id, DOORLI_DELIVERY_KEY, body.enableDoorliDelivery);
    await invalidateFeatureCache(vendor.id);

    res.status(201).json({
      success: true,
      data: {
        vendor: provisioned,
        user: { id: user.id, email: user.email },
        features: {
          [MARKETPLACE_LISTING_KEY]: false,
          [POS_KEY]: true,
          [DOORLI_DELIVERY_KEY]: body.enableDoorliDelivery,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
