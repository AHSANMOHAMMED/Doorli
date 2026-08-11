import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  createBroadcast,
  deleteRateLimitPolicy,
  erpControlStatus,
  erpModuleToggle,
  erpQuotaOverride,
  erpSettingUpdate,
  erpTenantControl,
  getMaintenanceAware,
  isServiceEnabled,
  listControlAudits,
  listRateLimitPolicies,
  listServiceStates,
  recordControlAudit,
  setMaintenance,
  setServiceState,
  upsertRateLimitPolicy,
} from '../../lib/control.js';
import type { ServiceKey } from '@doorli/types';

/**
 * Centralized control-plane routes mounted at /api/v1/admin/control.
 * Every action is audit-logged. These are the one-click enable/disable and
 * increase/reduce controls used by the super-admin console.
 */

const controlRouter = Router();
controlRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }): void {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

function actor(req: { user?: { phone?: string; sub?: string; email?: string } }): string {
  return req.user?.email || req.user?.phone || req.user?.sub || 'unknown';
}

// ============================= OVERVIEW =============================

controlRouter.get('/overview', async (req, res, next) => {
  try {
    requireAdmin(req);
    const [maintenance, services, rateLimits, audits, erpStatus] = await Promise.allSettled([
      getMaintenanceAware(),
      listServiceStates(),
      listRateLimitPolicies(),
      listControlAudits(10),
      erpControlStatus(),
    ]);
    res.json({
      success: true,
      data: {
        maintenance: maintenance.status === 'fulfilled' ? maintenance.value : null,
        services: services.status === 'fulfilled' ? services.value : {},
        rateLimits: rateLimits.status === 'fulfilled' ? rateLimits.value : [],
        recentAudit: audits.status === 'fulfilled' ? audits.value : { items: [], total: 0 },
        erp: erpStatus.status === 'fulfilled'
          ? (erpStatus.value as { success: boolean; data?: { tenants: unknown[] } })
          : { success: false, error: 'ERP unreachable' },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================= MAINTENANCE =============================

controlRouter.get('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    const window = await getMaintenanceAware();
    res.json({ success: true, data: window || { active: false, scope: 'all' } });
  } catch (err) {
    next(err);
  }
});

const maintenanceSchema = z.object({
  active: z.boolean(),
  message: z.string().max(300).optional(),
  reason: z.string().max(200).optional(),
  scope: z.enum(['all', 'marketplace', 'erp', 'delivery', 'ai', 'search', 'notifications', 'chat', 'storage', 'ride_hailing', 'emergency', 'forum', 'gov', 'auth']).optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

controlRouter.put('/maintenance', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = maintenanceSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid maintenance payload');
    const window = await setMaintenance({
      ...parsed.data,
      createdByName: actor(req),
    });
    await recordControlAudit({
      actor: actor(req),
      action: parsed.data.active ? 'maintenance.on' : 'maintenance.off',
      category: 'maintenance',
      targetType: 'global',
      summary: parsed.data.active
        ? `Maintenance ${parsed.data.scope || 'all'} enabled: ${parsed.data.message || ''}`
        : 'Maintenance disabled',
      metadata: parsed.data,
    });
    res.json({ success: true, data: window });
  } catch (err) {
    next(err);
  }
});

// ============================= SERVICE ON/OFF =============================

const SERVICE_KEYS: ServiceKey[] = [
  'marketplace', 'delivery', 'auth', 'notifications', 'search', 'ai', 'storage',
  'chat', 'ride_hailing', 'emergency', 'forum', 'gov', 'erp',
];

controlRouter.get('/services', async (req, res, next) => {
  try {
    requireAdmin(req);
    const states = await listServiceStates();
    res.json({ success: true, data: states });
  } catch (err) {
    next(err);
  }
});

controlRouter.put('/services/:key', async (req, res, next) => {
  try {
    requireAdmin(req);
    const key = req.params.key as ServiceKey;
    if (!SERVICE_KEYS.includes(key)) throw new AppError(400, `Unknown service '${key}'`);
    const enabled = z.boolean().parse(req.body?.enabled);
    const state = await setServiceState(key, enabled, actor(req), req.body?.notes);
    await recordControlAudit({
      actor: actor(req),
      action: enabled ? 'service.on' : 'service.off',
      category: 'service',
      targetType: 'global',
      targetId: key,
      summary: `${key} ${enabled ? 'enabled' : 'disabled'}`,
      metadata: { key, enabled },
    });
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
});

controlRouter.get('/services/:key', async (req, res, next) => {
  try {
    requireAdmin(req);
    const key = req.params.key as ServiceKey;
    if (!SERVICE_KEYS.includes(key)) throw new AppError(400, `Unknown service '${key}'`);
    res.json({ success: true, data: { key, enabled: await isServiceEnabled(key) } });
  } catch (err) {
    next(err);
  }
});

// ============================= RATE LIMIT POLICIES =============================

controlRouter.get('/rate-limits', async (req, res, next) => {
  try {
    requireAdmin(req);
    res.json({ success: true, data: await listRateLimitPolicies() });
  } catch (err) {
    next(err);
  }
});

const rateLimitSchema = z.object({
  path: z.string().trim().min(1).max(200),
  windowMs: z.coerce.number().int().positive().default(900000),
  limit: z.coerce.number().int().positive(),
  notes: z.string().max(300).optional(),
  isActive: z.boolean().optional(),
});

controlRouter.post('/rate-limits', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = rateLimitSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid rate-limit payload');
    const policy = await upsertRateLimitPolicy(parsed.data);
    await recordControlAudit({
      actor: actor(req),
      action: 'rate_limit.set',
      category: 'rate_limit',
      targetType: 'global',
      targetId: policy.path,
      summary: `Rate limit ${policy.path}: ${policy.limit}/${policy.windowMs}ms`,
      metadata: policy,
    });
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

controlRouter.delete('/rate-limits/:path', async (req, res, next) => {
  try {
    requireAdmin(req);
    const path = decodeURIComponent(req.params.path);
    const removed = await deleteRateLimitPolicy(path);
    if (!removed) throw new AppError(404, 'Policy not found');
    await recordControlAudit({
      actor: actor(req),
      action: 'rate_limit.delete',
      category: 'rate_limit',
      targetType: 'global',
      targetId: path,
      summary: `Rate limit removed for ${path}`,
    });
    res.json({ success: true, data: { removed } });
  } catch (err) {
    next(err);
  }
});

// ============================= ERP CONTROL CHANNEL =============================

controlRouter.get('/erp/status', async (req, res, next) => {
  try {
    requireAdmin(req);
    const tenantId = (req.query.tenantId as string | undefined) ?? undefined;
    const provider = (req.query.provider as string) === 'enterprise' ? 'enterprise' : 'simple';
    const result = await erpControlStatus(tenantId, provider);
    if (!result.success) throw new AppError(502, result.error || 'ERP unreachable');
    res.json({ success: true, data: { ...(result.data as object), provider } });
  } catch (err) {
    next(err);
  }
});

const erpTenantSchema = z.object({
  tenantId: z.string().uuid().or(z.string().min(1)),
  status: z.enum(['active', 'suspended', 'locked', 'cancelled']).optional(),
  statusReason: z.string().max(200).optional(),
  plan: z.enum(['trial', 'basic', 'standard', 'premium']).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
  aiEnabled: z.boolean().optional(),
  provider: z.enum(['simple', 'enterprise']).optional(),
}).strict();

controlRouter.post('/erp/tenant', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = erpTenantSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid tenant control payload');
    const provider = parsed.data.provider ?? 'simple';
    const result = await erpTenantControl({
      tenantId: parsed.data.tenantId,
      status: parsed.data.status,
      statusReason: parsed.data.statusReason,
      plan: parsed.data.plan,
      planExpiresAt: parsed.data.planExpiresAt ?? null,
      aiEnabled: parsed.data.aiEnabled,
    }, provider);
    if (!result.success) throw new AppError(502, result.error || 'ERP unreachable');
    await recordControlAudit({
      actor: actor(req),
      action: `tenant.${parsed.data.status ?? 'update'}`,
      category: 'tenant',
      targetType: 'tenant',
      targetId: parsed.data.tenantId,
      summary: `[${provider}] Tenant ${parsed.data.tenantId} → status=${parsed.data.status ?? 'unchanged'} plan=${parsed.data.plan ?? 'unchanged'} ai=${parsed.data.aiEnabled ?? 'unchanged'}`,
      metadata: parsed.data,
    });
    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
});

const erpQuotaSchema = z.object({
  tenantId: z.string().uuid().or(z.string().min(1)),
  maxUsers: z.number().int().min(0).nullable().optional(),
  maxSalesMonthly: z.number().int().min(0).nullable().optional(),
  maxDatabaseBytes: z.number().int().min(0).nullable().optional(),
  maxFileStorageBytes: z.number().int().min(0).nullable().optional(),
  tierName: z.string().min(1).nullable().optional(),
  provider: z.enum(['simple', 'enterprise']).optional(),
});

controlRouter.post('/erp/quota', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = erpQuotaSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid quota override payload');
    const provider = parsed.data.provider ?? 'simple';
    const result = await erpQuotaOverride({
      tenantId: parsed.data.tenantId,
      maxUsers: parsed.data.maxUsers ?? null,
      maxSalesMonthly: parsed.data.maxSalesMonthly ?? null,
      maxDatabaseBytes: parsed.data.maxDatabaseBytes ?? null,
      maxFileStorageBytes: parsed.data.maxFileStorageBytes ?? null,
      tierName: parsed.data.tierName ?? null,
    }, provider);
    if (!result.success) throw new AppError(502, result.error || 'ERP unreachable');
    await recordControlAudit({
      actor: actor(req),
      action: 'quota.set',
      category: 'quota',
      targetType: 'tenant',
      targetId: parsed.data.tenantId,
      summary: `[${provider}] Quota update for ${parsed.data.tenantId}: ${JSON.stringify(Object.fromEntries(Object.entries(parsed.data).filter(([k, v]) => k !== 'provider' && v !== undefined && v !== null)))}`,
      metadata: parsed.data,
    });
    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
});

const erpModuleSchema = z.object({
  tenantId: z.string().uuid().or(z.string().min(1)).nullable().optional(),
  moduleKey: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(60).nullable().optional(),
  isEnabled: z.boolean(),
  provider: z.enum(['simple', 'enterprise']).optional(),
});

controlRouter.post('/erp/module', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = erpModuleSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid module toggle payload');
    const provider = parsed.data.provider ?? 'simple';
    const result = await erpModuleToggle({ tenantId: parsed.data.tenantId, moduleKey: parsed.data.moduleKey, role: parsed.data.role ?? null, isEnabled: parsed.data.isEnabled }, provider);
    if (!result.success) throw new AppError(502, result.error || 'ERP unreachable');
    await recordControlAudit({
      actor: actor(req),
      action: parsed.data.isEnabled ? 'module.on' : 'module.off',
      category: 'module',
      targetType: parsed.data.tenantId ? 'tenant' : 'global',
      targetId: parsed.data.tenantId ?? parsed.data.moduleKey,
      summary: `[${provider}] ERP module '${parsed.data.moduleKey}' ${parsed.data.isEnabled ? 'enabled' : 'disabled'}${parsed.data.tenantId ? ` for ${parsed.data.tenantId}` : ' (all tenants)'}`,
      metadata: parsed.data,
    });
    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
});

const erpSettingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.record(z.string(), z.unknown()),
  description: z.string().max(300).optional(),
  provider: z.enum(['simple', 'enterprise']).optional(),
});

controlRouter.post('/erp/settings', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = erpSettingSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid setting payload');
    const provider = parsed.data.provider ?? 'simple';
    const result = await erpSettingUpdate({ key: parsed.data.key, value: parsed.data.value, description: parsed.data.description }, provider);
    if (!result.success) throw new AppError(502, result.error || 'ERP unreachable');
    await recordControlAudit({
      actor: actor(req),
      action: 'erp.setting',
      category: 'module',
      targetType: 'global',
      targetId: parsed.data.key,
      summary: `[${provider}] ERP setting '${parsed.data.key}' updated`,
      metadata: parsed.data,
    });
    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
});

// ============================= BROADCASTS =============================

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(2000),
  audience: z.enum(['all', 'customers', 'vendors', 'drivers', 'admins', 'erp_tenants']),
  type: z.enum(['announcement', 'warning', 'info', 'maintenance']).optional(),
});

controlRouter.post('/broadcasts', async (req, res, next) => {
  try {
    requireAdmin(req);
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid broadcast payload');
    const broadcast = await createBroadcast(parsed.data);
    await recordControlAudit({
      actor: actor(req),
      action: 'broadcast.send',
      category: 'broadcast',
      targetType: 'global',
      summary: `Broadcast '${parsed.data.title}' → ${parsed.data.audience}`,
      metadata: parsed.data,
    });
    res.json({ success: true, data: broadcast });
  } catch (err) {
    next(err);
  }
});

// ============================= AUDIT =============================

controlRouter.get('/audit', async (req, res, next) => {
  try {
    requireAdmin(req);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    res.json({ success: true, data: await listControlAudits(limit, offset) });
  } catch (err) {
    next(err);
  }
});

export default controlRouter;