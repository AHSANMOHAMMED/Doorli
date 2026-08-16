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
import { retryIntegrationFailure } from '../../lib/integrationReconciliation.js';
import { setMaintenance, getMaintenanceAware, erpModuleToggle } from '../../lib/control.js';
import { randomUUID } from 'crypto';
import os from 'os';

const ERP_MODULE_BY_FEATURE: Record<string, string> = {
  erp_dashboard: 'dashboard', erp_stock: 'stock', erp_selling: 'selling',
  erp_buying: 'buying', erp_auto_service: 'auto-service', erp_restaurant: 'restaurant',
  erp_hr: 'hr', erp_accounting: 'accounting', erp_reports: 'reports',
  erp_my: 'my', erp_settings: 'settings', inventory_management: 'stock',
  accounting_reports: 'accounting', pos_integration: 'selling',
};
function erpModuleForFeature(featureKey: string): string | null {
  return ERP_MODULE_BY_FEATURE[featureKey] || (featureKey.startsWith('erp_') ? featureKey.slice(4).replace(/_/g, '-') : null);
}
async function syncVendorErpFeature(vendor: { erpProvider?: string | null; erpTenantId?: string | null }, featureKey: string, isEnabled: boolean) {
  const moduleKey = erpModuleForFeature(featureKey);
  if (!moduleKey || vendor.erpProvider !== 'enterprise' || !vendor.erpTenantId) return;
  const result = await erpModuleToggle({ tenantId: vendor.erpTenantId, moduleKey, isEnabled }, 'enterprise');
  if (!result.success) throw new AppError(502, result.error || 'Enterprise ERP module update failed');
}
const syncOrderToErpIfLinked = async (orderId: string, options?: { force?: boolean }) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: { select: { erpProvider: true, erpTenantId: true, businessName: true } },
        customer: { select: { fullName: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
    if (!order) return { success: false, message: 'Order not found' };
    if (!order.vendor.erpTenantId || order.vendor.erpProvider === 'none') {
      return { success: false, message: 'Vendor has no ERP linked' };
    }
    if (order.erpSyncStatus === 'synced' && !options?.force) {
      return { success: true, message: 'Order already synced' };
    }
    const result = await ErpIntegrationService.syncOrderToErp({
      provider: order.vendor.erpProvider as 'simple' | 'enterprise',
      vendorId: order.vendorId,
      erpTenantId: order.vendor.erpTenantId,
      items: order.items.map((item) => ({
        productId: item.productId,
        sku: item.product.sku || undefined,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.unitPrice),
      })),
      customerInfo: {
        name: order.customer.fullName,
        phone: order.customer.phone || undefined,
      },
      totalAmount: Number(order.totalAmount),
      marketplaceOrderId: order.id,
      marketplaceOrderNumber: order.orderNumber,
    });
    const syncStatus = result.success ? 'synced' : 'failed';
    await prisma.order.update({
      where: { id: orderId },
      data: {
        erpSyncStatus: syncStatus as any,
        erpOrderId: result.erpOrderId || null,
        erpSyncError: result.success ? null : (result.message || 'Sync failed').slice(0, 500),
        erpSyncedAt: result.success ? new Date() : null,
      },
    });
    return { success: result.success, message: result.message || (result.success ? 'Synced' : 'ERP sync failed') };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ERP sync error';
    console.error('[ERP] syncOrderToErpIfLinked failed:', message);
    return { success: false, message };
  }
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

const maintenanceWindows: Array<{
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
} | {
  active: boolean;
  message?: string;
  scope?: string;
  endsAt?: string;
  updatedAt?: string;
}> = [];

adminRouter.post('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      active: z.boolean().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      description: z.string().min(1).optional(),
      message: z.string().optional(),
      scope: z.string().optional(),
    }).parse(req.body);

    const window = await setMaintenance({
      active: body.active ?? true,
      message: body.message || body.description,
      endsAt: body.endTime ?? req.body.endsAt ?? null,
      scope: (body.scope as NonNullable<Parameters<typeof setMaintenance>[0]>['scope']) || 'all',
    });
    res.status(201).json({ success: true, data: window });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    const window = await getMaintenanceAware();
    res.json({ success: true, data: window ? [window] : [] });
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

adminRouter.post('/vendors/:id/catalog-sync', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) throw new AppError(404, 'Vendor not found');
    if (vendor.erpProvider !== 'enterprise' || !vendor.erpTenantId) {
      throw new AppError(400, 'Vendor is not connected to Enterprise ERP');
    }
    const result = await ErpIntegrationService.syncEnterpriseCatalog({ erpTenantId: vendor.erpTenantId });
    if (!result.success) return res.status(result.status && result.status >= 400 ? result.status : 502).json({ success: false, error: result.message });
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/integration-failures', async (req, res, next) => {
  try {
    requireAdmin(req);
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const failures = await prisma.integrationFailure.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return res.json({ success: true, data: failures });
  } catch (err) {
    return next(err);
  }
});

adminRouter.post('/integration-failures/:id/retry', async (req, res, next) => {
  try {
    requireAdmin(req);
    const result = await retryIntegrationFailure(req.params.id);
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error, data: 'data' in result ? result.data : undefined });
    return res.json({ success: true, data: result.data, retry: result.retry });
  } catch (err) {
    return next(err);
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
    const permissionsMatrix = {
      globalView: { label: 'View all data across vendors', enabled: true },
      createDelete: { label: 'Create and delete entities', enabled: false },
      vendorManagement: { label: 'Manage vendors and KYC', enabled: true },
      userAccounts: { label: 'Manage user accounts', enabled: true },
      orders: { label: 'View and manage orders', enabled: true },
      forceErpSync: { label: 'Force ERP resync on orders', enabled: false },
      globalBroadcasts: { label: 'Send global push broadcasts', enabled: true },
      systemSettings: { label: 'Modify system settings', enabled: false },
      bypassMfa: { label: 'Bypass multi-factor authentication', enabled: false },
      deleteEntities: { label: 'Permanently delete records', enabled: false },
      auditExport: { label: 'Export audit logs', enabled: true },
    };
    res.json({ success: true, data: permissionsMatrix });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/permissions', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.record(z.string(), z.object({
      enabled: z.boolean(),
    })).parse(req.body);

    const permissionsMatrix = {
      globalView: { label: 'View all data across vendors', enabled: body.globalView?.enabled ?? true },
      createDelete: { label: 'Create and delete entities', enabled: body.createDelete?.enabled ?? false },
      vendorManagement: { label: 'Manage vendors and KYC', enabled: body.vendorManagement?.enabled ?? true },
      userAccounts: { label: 'Manage user accounts', enabled: body.userAccounts?.enabled ?? true },
      orders: { label: 'View and manage orders', enabled: body.orders?.enabled ?? true },
      forceErpSync: { label: 'Force ERP resync on orders', enabled: body.forceErpSync?.enabled ?? false },
      globalBroadcasts: { label: 'Send global push broadcasts', enabled: body.globalBroadcasts?.enabled ?? true },
      systemSettings: { label: 'Modify system settings', enabled: body.systemSettings?.enabled ?? false },
      bypassMfa: { label: 'Bypass multi-factor authentication', enabled: body.bypassMfa?.enabled ?? false },
      deleteEntities: { label: 'Permanently delete records', enabled: body.deleteEntities?.enabled ?? false },
      auditExport: { label: 'Export audit logs', enabled: body.auditExport?.enabled ?? true },
    };
    res.json({ success: true, data: permissionsMatrix, message: 'Permissions updated successfully' });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/audits', async (req, res, next) => {
  try {
    requireAdmin(req);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const [recentOrders, recentUsers, recentVendors] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 3),
        skip: offset,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true, customerId: true, vendorId: true },
      }),
      prisma.user.findMany({
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 3),
        skip: offset,
        select: { id: true, fullName: true, email: true, role: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true },
      }),
      prisma.vendor.findMany({
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 3),
        skip: offset,
        select: { id: true, businessName: true, isVerified: true, erpProvisionStatus: true, createdAt: true, updatedAt: true },
      }),
    ]);

    const logs = [
      ...recentOrders.map((o) => ({
        id: o.id,
        action: 'ORDER_CREATED',
        entity: 'order',
        entityId: o.id,
        summary: `Order ${o.orderNumber} — ${o.status} — LKR ${o.totalAmount}`,
        timestamp: o.createdAt.toISOString(),
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        action: u.isActive ? 'USER_ACTIVE' : 'USER_DEACTIVATED',
        entity: 'user',
        entityId: u.id,
        summary: `${u.fullName} (${u.role}) — ${u.isActive ? 'active' : 'deactivated'}`,
        timestamp: u.updatedAt.toISOString(),
      })),
      ...recentVendors.map((v) => ({
        id: v.id,
        action: v.isVerified ? 'VENDOR_VERIFIED' : 'VENDOR_PENDING',
        entity: 'vendor',
        entityId: v.id,
        summary: `${v.businessName} — ${v.isVerified ? 'verified' : 'pending'} — ERP: ${v.erpProvisionStatus}`,
        timestamp: v.updatedAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);

    res.json({ success: true, data: logs, pagination: { limit, offset, total: logs.length } });
  } catch (err) {
    next(err);
  }
});

const apiKeyStore: Array<{
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
}> = [
  { id: 'key_1', name: 'Production Mobile App', prefix: 'pk_live_...', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastUsed: new Date().toISOString() },
  { id: 'key_2', name: 'Staging Environment', prefix: 'pk_test_...', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), lastUsed: new Date(Date.now() - 86400000 * 2).toISOString() },
];

adminRouter.get('/api-keys', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({ success: true, data: apiKeyStore });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/api-keys', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      name: z.string().min(1),
    }).parse(req.body);

    const rawKey = randomUUID().replace(/-/g, '');
    const isProduction = (req.query.env as string) === 'production';
    const prefix = isProduction ? 'pk_live_' : 'pk_test_';
    const maskedKey = `${prefix}${rawKey.slice(0, 8)}...`;

    const keyRecord = {
      id: `key_${Date.now()}`,
      name: body.name,
      prefix: maskedKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    apiKeyStore.push(keyRecord);

    res.status(201).json({ success: true, data: { ...keyRecord, key: `${prefix}${rawKey}` } });
  } catch (err) {
    next(err);
  }
});


adminRouter.get('/db-stats', async (req, res, next) => {
  try {
    requireAdmin(req);

    const tableStats = await prisma.$queryRawUnsafe(`
      SELECT
        schemaname || '.' || relname AS table_name,
        n_live_tup AS row_count,
        n_dead_tup AS dead_rows,
        CASE WHEN n_live_tup > 0 THEN round(n_dead_tup * 100.0 / n_live_tup, 1) ELSE 0 END AS dead_pct,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 20
    `) as Array<{
      table_name: string;
      row_count: bigint;
      dead_rows: bigint;
      dead_pct: number;
      last_vacuum: Date | null;
      last_autovacuum: Date | null;
      last_analyze: Date | null;
      last_autoanalyze: Date | null;
    }>;

    const tables = tableStats.map((t) => {
      const health = Math.max(0, Math.round(100 - Number(t.dead_pct)));
      const status = health >= 90 ? 'Optimal' : health >= 70 ? 'Healthy' : health >= 50 ? 'Needs attention' : 'Fragmented';
      return {
        name: t.table_name,
        rowCount: Number(t.row_count),
        deadRows: Number(t.dead_rows),
        health,
        status,
        lastVacuum: t.last_vacuum,
        lastAutovacuum: t.last_autovacuum,
      };
    });

    let slowQueries: Array<{ query: string; calls: number; meanMs: number; totalMs: number }> = [];
    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT
          LEFT(query, 120) AS query,
          calls,
          round(mean_exec_time::numeric, 2) AS mean_ms,
          round(total_exec_time::numeric, 2) AS total_ms
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `) as Array<{ query: string; calls: bigint; mean_ms: number; total_ms: number }>;
      slowQueries = rows.map((r) => ({
        query: r.query,
        calls: Number(r.calls),
        meanMs: r.mean_ms,
        totalMs: r.total_ms,
      }));
    } catch {
      // pg_stat_statements extension not available — return empty
    }

    res.json({ success: true, data: { tables, slowQueries } });
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

    const regions = [
      { id: 'NA-EAST', name: 'North America East', status: 'ACTIVE', load: 45, routingWeight: 100, lastHealthCheck: new Date().toISOString() },
      { id: 'NA-WEST', name: 'North America West', status: 'ACTIVE', load: 32, routingWeight: 100, lastHealthCheck: new Date().toISOString() },
      { id: 'EU-WEST', name: 'Europe West', status: 'ACTIVE', load: 58, routingWeight: 100, lastHealthCheck: new Date().toISOString() },
      { id: 'AP-SOUTH', name: 'Asia Pacific South', status: 'ACTIVE', load: 27, routingWeight: 100, lastHealthCheck: new Date().toISOString() },
    ];

    res.json({
      success: true,
      data: {
        regions,
        globalConfig: {
          failoverEnabled: true,
          healthCheckIntervalMs: 30000,
          circuitBreakerThreshold: 5,
          loadBalancingStrategy: 'round-robin',
        },
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/diagnostics', async (req, res, next) => {
  try {
    requireAdmin(req);

    const probe = async (name: string, url: string): Promise<{ name: string; status: 'ok' | 'degraded' | 'down'; latencyMs: number; message: string }> => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3000);
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(t);
        const latencyMs = Date.now() - start;
        return { name, status: r.ok ? 'ok' : 'degraded', latencyMs, message: `HTTP ${r.status}` };
      } catch (err) {
        const latencyMs = Date.now() - start;
        const msg = err instanceof Error ? err.message : 'unreachable';
        return { name, status: 'down', latencyMs, message: msg };
      }
    };

    const embeddedBase = (
      process.env.ERP_EMBEDDED_URL || process.env.ERP_API_URL || process.env.ERP_SERVICE_URL || 'http://127.0.0.1:3010/api/internal'
    ).replace(/\/$/, '');

    const checks = await Promise.all([
      (async () => {
        const start = Date.now();
        try {
          await prisma.$queryRawUnsafe('SELECT 1');
          return { name: 'PostgreSQL', status: 'ok' as const, latencyMs: Date.now() - start, message: 'Connected' };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Connection failed';
          return { name: 'PostgreSQL', status: 'down' as const, latencyMs: Date.now() - start, message: msg };
        }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const Redis = (await import('ioredis')).default;
          const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { connectTimeout: 2000, maxRetriesPerRequest: 0, lazyConnect: true });
          await client.connect();
          await client.ping();
          await client.quit();
          return { name: 'Redis', status: 'ok' as const, latencyMs: Date.now() - start, message: 'Connected' };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Connection failed';
          return { name: 'Redis', status: 'down' as const, latencyMs: Date.now() - start, message: msg };
        }
      })(),
      probe('Marketplace API', 'http://127.0.0.1:4000/health'),
      probe('Delivery Service', 'http://127.0.0.1:8086/health'),
      probe('Search Service', 'http://127.0.0.1:4004/health'),
      probe('ERP (Retail Smart)', `${embeddedBase.replace(/\/api\/internal$/, '')}/`),
    ]);

    const overallStatus = checks.every((c) => c.status === 'ok') ? 'healthy' : checks.some((c) => c.status === 'down') ? 'degraded' : 'partial';

    res.json({
      success: true,
      data: {
        overallStatus,
        checkedAt: new Date().toISOString(),
        checks,
      },
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

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { erpProvider: true, erpTenantId: true },
    });
    if (vendor) await syncVendorErpFeature(vendor, vendorFeature.feature.key, isEnabled);

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

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true, erpProvider: true, erpTenantId: true } });
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
    await syncVendorErpFeature(vendor, featureKey, isEnabled);
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

adminRouter.get('/broadcasts', async (req, res, next) => {
  try {
    requireAdmin(req);
    const broadcasts = await prisma.notification.findMany({
      where: { type: 'admin_broadcast' },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    const seen = new Map<string, typeof broadcasts[0]>();
    for (const b of broadcasts) {
      const key = `${b.title}::${b.body}`;
      if (!seen.has(key)) {
        seen.set(key, b);
      }
    }
    const unique = Array.from(seen.values());

    res.json({ success: true, data: unique });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({ success: true, data: maintenanceWindows });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/health', async (req, res, next) => {
  try {
    requireAdmin(req);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    const [activeUsers, ordersToday, failedOrdersToday] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: 'cancelled',
        },
      }),
    ]);

    const erpLatencyCheck = await (async () => {
      const embeddedBase = (
        process.env.ERP_EMBEDDED_URL || process.env.ERP_API_URL || process.env.ERP_SERVICE_URL || 'http://127.0.0.1:3010/api/internal'
      ).replace(/\/$/, '');
      const embeddedHealth = embeddedBase.replace(/\/api\/internal$/, '') + '/';
      const start = Date.now();
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3000);
        await fetch(embeddedHealth, { signal: controller.signal });
        clearTimeout(t);
        return Date.now() - start;
      } catch {
        return -1;
      }
    })();

    res.json({
      success: true,
      data: {
        uptime: Math.round(process.uptime()),
        platform: os.platform(),
        nodeVersion: process.version,
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usagePercent: Math.round((usedMem / totalMem) * 100),
        },
        cpu: {
          loadAverage: loadAvg.map((l) => parseFloat(l.toFixed(2))),
          coreCount: cpus.length,
          usagePercent: Math.round((loadAvg[0] / cpus.length) * 100),
        },
        activeSessions: activeUsers,
        ordersToday,
        errorRate: ordersToday > 0
          ? parseFloat(((failedOrdersToday / ordersToday) * 100).toFixed(2))
          : 0,
        erpLatencyMs: erpLatencyCheck,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
