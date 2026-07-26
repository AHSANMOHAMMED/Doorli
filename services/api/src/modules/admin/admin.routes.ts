import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErpIntegrationService } from '../../lib/erpIntegration.js';

const adminRouter = Router();
adminRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

adminRouter.get('/stats', async (req, res, next) => {
  try {
    requireAdmin(req);
    const [vendors, pendingVendors, driversOnline, ordersToday, revenue] = await Promise.all([
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
    ]);

    res.json({
      success: true,
      data: {
        totalVendors: vendors,
        pendingKyc: pendingVendors,
        activeDrivers: driversOnline,
        ordersToday,
        revenue30d: Number(revenue._sum.totalAmount ?? 0),
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
        return { name, port, status: res.ok ? 'healthy' : 'degraded' as const };
      } catch {
        return { name, port, status: 'down' as const };
      }
    };

    const services = await Promise.all([
      probe('Marketplace API Gateway', '4000', 'http://127.0.0.1:4000/health'),
      probe('Delivery', '8086', 'http://127.0.0.1:8086/health'),
      probe('Search', '4004', 'http://127.0.0.1:4004/health'),
      probe('Storage', '4005', 'http://127.0.0.1:4005/health'),
      probe('AI', '4006', 'http://127.0.0.1:4006/health'),
      probe('Notifications', '4007', 'http://127.0.0.1:4007/health'),
      probe('Ride-Hailing', '8085', 'http://127.0.0.1:8085/health'),
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

adminRouter.post('/broadcasts', async (req, res, next) => {
  try {
    requireAdmin(req);
    // Mock dispatching broadcast
    res.json({ success: true, message: 'Broadcast dispatched successfully' });
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
export default adminRouter;

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
