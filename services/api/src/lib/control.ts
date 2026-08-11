import { prisma } from '@doorli/db';
import { getRedis } from './redis.js';
import type {
  ControlBroadcast,
  ControlResult,
  ErpQuotaOverride,
  ErpTenantControl,
  MaintenanceWindow,
  RateLimitPolicy,
  ServiceStateRecord,
  ServiceKey,
} from '@doorli/types';
import { env } from '../config/env.js';

/**
 * Centralized super-admin control-plane helpers.
 * Source of truth is Postgres (Prisma); a short TTL in-memory cache keeps the
 * per-request maintenance/service checks cheap without a cache round-trip.
 */

const CACHE_TTL_MS = 5_000;
let cachedMaintenance: { active: boolean; scope: string; fetchedAt: number } | null = null;
const serviceCache = new Map<string, { enabled: boolean; fetchedAt: number }>();

/** Publish current maintenance/service state to Redis for the gateway gate. */
async function publishControlState(maintenance?: StatusWindow, serviceKey?: ServiceKey): Promise<void> {
  const redis = getRedis();
  try {
    if (redis.status !== 'ready') await redis.connect();
    if (maintenance) {
      await redis.setex('ctl:maintenance', 300, JSON.stringify({
        active: maintenance.active,
        scope: maintenance.scope ?? 'all',
        message: maintenance.message ?? undefined,
        endsAt: maintenance.endsAt ? maintenance.endsAt.toISOString() : null,
      }));
    }
    const states = await listServiceStates();
    await redis.setex('ctl:services', 300, JSON.stringify(
      Object.fromEntries(
        (Object.keys(states) as ServiceKey[]).map((k) => [`service:${k}`, { enabled: states[k] === 'enabled' }]),
      ),
    ));
    if (serviceKey) serviceCache.set(serviceKey, { enabled: states[serviceKey] === 'enabled', fetchedAt: Date.now() });
  } catch (error) {
    console.error('[control] publish state failed', error);
  }
}

type StatusWindow = {
  active: boolean;
  scope: string;
  message: string | null;
  endsAt: Date | null;
};

// ============================= MAINTENANCE =============================

async function currentMaintenanceWindow(): Promise<{
  id: string;
  active: boolean;
  message: string | null;
  reason: string | null;
  scope: string;
  endsAt: Date | null;
} | null> {
  if (cachedMaintenance && Date.now() - cachedMaintenance.fetchedAt < CACHE_TTL_MS) {
    return null; // never cached as "no window" — recheck quickly
  }
  const now = new Date();
  const window = await prisma.maintenanceWindow.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (!window) {
    cachedMaintenance = { active: false, scope: 'all', fetchedAt: Date.now() };
    return null;
  }
  const expired = window.endsAt && window.endsAt < now;
  cachedMaintenance = { active: !expired, scope: window.scope, fetchedAt: Date.now() };
  return expired ? null : window;
}

export async function isMaintenanceActive(scopeOfPath: 'all' | 'marketplace' | 'erp' | ServiceKey): Promise<boolean> {
  const window = await currentMaintenanceWindow();
  if (!window) return false;
  if (window.scope === 'all') return true;
  return window.scope === scopeOfPath;
}

export async function getMaintenanceAware(): Promise<MaintenanceWindow | null> {
  const window = await currentMaintenanceWindow();
  if (!window) return null;
  return {
    id: window.id,
    active: window.active,
    message: window.message ?? undefined,
    reason: window.reason ?? undefined,
    scope: (window.scope as MaintenanceWindow['scope']) ?? 'all',
    endsAt: window.endsAt?.toISOString(),
    updatedAt: undefined,
  };
}

export async function setMaintenance(input: {
  active: boolean;
  message?: string;
  reason?: string;
  scope?: MaintenanceWindow['scope'];
  endsAt?: string | null;
  createdByName?: string;
}): Promise<MaintenanceWindow> {
  cachedMaintenance = null;
  const existing = await prisma.maintenanceWindow.findFirst({ orderBy: { updatedAt: 'desc' } });

  if (input.active) {
    const data = {
      active: true,
      message: input.message ?? null,
      reason: input.reason ?? null,
      scope: (input.scope ?? 'all') as string,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      createdBy: input.createdByName ?? 'super-admin',
    };
    const row = existing
      ? await prisma.maintenanceWindow.update({ where: { id: existing.id }, data })
      : await prisma.maintenanceWindow.create({
          data: { ...data, active: true },
        });
    const normalized = normalizeMaintenance(row);
    await publishControlState({ active: true, scope: data.scope, message: data.message, endsAt: data.endsAt });
    return normalized;
  }

  if (existing) {
    await prisma.maintenanceWindow.update({ where: { id: existing.id }, data: { active: false } });
  }
  await publishControlState({ active: false, scope: 'all', message: input.message ?? null, endsAt: null });
  return { active: false, scope: 'all', message: input.message ?? undefined };
}

function normalizeMaintenance(row: {
  active: boolean; message: string | null; reason: string | null; scope: string; endsAt: Date | null; updatedAt: Date;
}): MaintenanceWindow {
  return {
    active: row.active,
    message: row.message ?? undefined,
    reason: row.reason ?? undefined,
    scope: (row.scope as MaintenanceWindow['scope']) ?? 'all',
    endsAt: row.endsAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

// ============================= SERVICE STATE =============================

export async function isServiceEnabled(key: ServiceKey): Promise<boolean> {
  const hit = serviceCache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.enabled;
  // Default to enabled when no explicit row exists.
  const row = await prisma.serviceState.findUnique({ where: { key } });
  const enabled = row ? row.enabled : true;
  serviceCache.set(key, { enabled, fetchedAt: Date.now() });
  return enabled;
}

export async function setServiceState(
  key: ServiceKey,
  enabled: boolean,
  updatedBy?: string,
  notes?: string,
): Promise<{ key: string; enabled: boolean }> {
  serviceCache.set(key, { enabled, fetchedAt: Date.now() });
  const row = await prisma.serviceState.upsert({
    where: { key },
    update: { enabled, updatedBy: updatedBy ?? null, notes: notes ?? null },
    create: { key, enabled, updatedBy: updatedBy ?? null, notes: notes ?? null },
  });
  await publishControlState(undefined, key);
  return { key: row.key, enabled: row.enabled };
}

export async function listServiceStates(): Promise<ServiceStateRecord> {
  const rows = await prisma.serviceState.findMany();
  const map = new Map(rows.map((r) => [r.key, r]));
  const keys: ServiceKey[] = [
    'marketplace', 'delivery', 'auth', 'notifications', 'search', 'ai', 'storage',
    'chat', 'ride_hailing', 'emergency', 'forum', 'gov', 'erp',
  ];
  const state: Record<ServiceKey, 'enabled' | 'disabled'> = {
    marketplace: 'enabled', delivery: 'enabled', auth: 'enabled', notifications: 'enabled',
    search: 'enabled', ai: 'enabled', storage: 'enabled', chat: 'enabled', ride_hailing: 'enabled',
    emergency: 'enabled', forum: 'enabled', gov: 'enabled', erp: 'enabled',
  };
  for (const k of keys) state[k] = map.get(k) && !map.get(k)!.enabled ? 'disabled' : 'enabled';
  return state;
}

// ============================= RATE LIMIT POLICIES =============================

export async function listRateLimitPolicies(): Promise<RateLimitPolicy[]> {
  const rows = await prisma.rateLimitPolicy.findMany({ orderBy: { updatedAt: 'desc' } });
  return rows.map((r) => ({
    id: r.id,
    path: r.path,
    windowMs: r.windowMs,
    limit: r.limit,
    notes: r.notes ?? undefined,
    isActive: r.isActive,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function upsertRateLimitPolicy(input: {
  path: string;
  windowMs: number;
  limit: number;
  notes?: string;
  isActive?: boolean;
}): Promise<RateLimitPolicy> {
  const row = await prisma.rateLimitPolicy.upsert({
    where: { path: input.path },
    update: {
      windowMs: input.windowMs,
      limit: input.limit,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
    },
    create: {
      path: input.path,
      windowMs: input.windowMs,
      limit: input.limit,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
    },
  });
  return {
    id: row.id,
    path: row.path,
    windowMs: row.windowMs,
    limit: row.limit,
    notes: row.notes ?? undefined,
    isActive: row.isActive,
  };
}

export async function deleteRateLimitPolicy(path: string): Promise<boolean> {
  const res = await prisma.rateLimitPolicy.deleteMany({ where: { path } });
  return res.count > 0;
}

// ============================= AUDIT =============================

export async function recordControlAudit(input: {
  actor: string;
  action: string;
  category?: string;
  targetType: string;
  targetId?: string;
  summary: string;
  metadata?: unknown;
}) {
  try {
    await prisma.controlAudit.create({
      data: {
        actor: input.actor.slice(0, 100),
        action: input.action.slice(0, 100),
        category: input.category?.slice(0, 50) ?? null,
        targetType: input.targetType.slice(0, 50),
        targetId: input.targetId?.slice(0, 100) ?? null,
        summary: input.summary.slice(0, 500),
        metadata: input.metadata as object | undefined,
      },
    });
  } catch (error) {
    console.error('[control] audit write failed:', error);
  }
}

export async function listControlAudits(limit = 50, offset = 0) {
  const [rows, total] = await Promise.all([
    prisma.controlAudit.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
    prisma.controlAudit.count(),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      actor: r.actor,
      action: r.action,
      category: r.category,
      targetType: r.targetType,
      targetId: r.targetId,
      summary: r.summary,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

// ============================= ERP CONTROL CHANNEL =============================

type ErpProvider = 'simple' | 'enterprise';

function erpControlBase(provider: ErpProvider): string {
  if (provider === 'enterprise') {
    const raw = process.env.ERP_ENTERPRISE_URL || '';
    if (!raw) return '';
    return raw.replace(/\/api\/method\/[\w.]+$/, '');
  }
  return (env.ERP_SERVICE_URL || 'http://localhost:3010').replace(/\/$/, '');
}

function erpControlPath(provider: ErpProvider, action: string): string {
  if (provider === 'enterprise') {
    return `/api/method/doorli_core.api.control_${action}`;
  }
  // The embedded ERP serves the status snapshot at /api/internal/control
  // itself (no /status suffix); tenant/module/quota/settings are sub-routes.
  if (action === 'status') {
    return '/api/internal/control';
  }
  return `/api/internal/control/${action}`;
}

function erpSecretToken(): string {
  return process.env.ERP_INTERNAL_SECRET || env.ERP_INTERNAL_SECRET;
}

function enterpriseControlSecret(): string {
  return process.env.DOORLI_WEBHOOK_SECRET || process.env.ERP_ENTERPRISE_SECRET || erpSecretToken();
}

/** Forward a control command to the ERP internal control channel. */
async function erpControlCall<T = unknown>(
  path: string,
  body?: unknown,
  provider: ErpProvider = 'simple',
): Promise<ControlResult<T>> {
  const base = erpControlBase(provider);
  if (!base) {
    return {
      success: false,
      error: provider === 'enterprise' ? 'ERP_ENTERPRISE_URL is not configured' : 'ERP_SERVICE_URL is not configured',
    };
  }
  const action = path.replace(/^\//, '');
  const url = `${base}${erpControlPath(provider, action)}`;
  try {
    const isEnterprise = provider === 'enterprise';
    const res = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: isEnterprise
        ? { 'Content-Type': 'application/json', 'X-Doorli-Secret': enterpriseControlSecret() }
        : { 'Content-Type': 'application/json', 'x-internal-secret': erpSecretToken() },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (isEnterprise && (res.status === 403 || res.status === 401)) {
      return { success: false, error: 'Enterprise control unauthorized (check DOORLI_WEBHOOK_SECRET)' };
    }
    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
      message?: string | T;
      data?: T;
    } | null;
    // Frappe wraps whitelisted method return values in `message`; unwrap it so
    // enterprise responses share the same shape as the embedded ERP channel.
    const payload = isEnterprise && json && typeof json.message === 'object' ? (json.message as unknown as { success?: boolean; error?: string; message?: string; data?: T }) : json;
    if (!res.ok || !payload || payload.success === false) {
      return {
        success: false,
        error: payload?.error || (typeof payload?.message === 'string' ? payload.message : undefined) || `ERP control failed (${res.status})`,
      };
    }
    if ('data' in (payload as object)) {
      return { success: true, data: payload.data as T };
    }
    return { success: true, data: payload as unknown as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ERP unreachable';
    return { success: false, error: `${provider} control unreachable: ${message}` };
  }
}

export function erpTenantControl(payload: ErpTenantControl, provider: ErpProvider = 'simple') {
  const body = provider === 'enterprise'
    ? { company: payload.tenantId, status: payload.status, statusReason: payload.statusReason, plan: payload.plan, planExpiresAt: payload.planExpiresAt ?? null, aiEnabled: payload.aiEnabled }
    : payload;
  return erpControlCall('/tenant', body, provider);
}

export function erpQuotaOverride(payload: ErpQuotaOverride, provider: ErpProvider = 'simple') {
  const body = provider === 'enterprise'
    ? { company: payload.tenantId, plan: payload.tierName ?? null, maxUsers: payload.maxUsers ?? null }
    : payload;
  return erpControlCall('/quota', body, provider);
}

export function erpModuleToggle(payload: {
  tenantId?: string | null;
  moduleKey: string;
  role?: string | null;
  isEnabled: boolean;
}, provider: ErpProvider = 'simple') {
  if (provider === 'enterprise') {
    return erpControlCall('/module', { moduleKey: payload.moduleKey, isEnabled: payload.isEnabled }, provider);
  }
  return erpControlCall('/module', payload, provider);
}

export function erpSettingUpdate(payload: { key: string; value: Record<string, unknown>; description?: string }, provider: ErpProvider = 'simple') {
  if (provider === 'enterprise') {
    return erpControlCall('/settings', payload, provider);
  }
  return erpControlCall('/settings', payload, provider);
}

export function erpControlStatus(tenantId?: string, provider: ErpProvider = 'simple') {
  const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return erpControlCall<{
    settings: Array<{ key: string; value: unknown }>;
    globalModuleToggles: Record<string, { isEnabled: boolean }>;
    tenants: unknown[];
  }>(`/status${q}`, undefined, provider);
}

// ============================= BROADCASTS =============================

export async function createBroadcast(input: {
  title: string;
  body: string;
  audience: ControlBroadcast['audience'];
  type?: ControlBroadcast['type'];
}): Promise<ControlBroadcast> {
  const messages: Array<{ userId: string; type: string; title: string; body: string }> = [];
  const audienceCustomers = input.audience === 'customers' || input.audience === 'all';
  const audienceVendors = input.audience === 'vendors' || input.audience === 'all';
  const audienceDrivers = input.audience === 'drivers' || input.audience === 'all';
  const audienceAdmins = input.audience === 'admins' || input.audience === 'all';

  const [customers, vendors, drivers, admins] = await Promise.all([
    audienceCustomers ? prisma.user.findMany({ where: { role: 'customer' }, select: { id: true } }) : [],
    audienceVendors
      ? prisma.vendor.findMany({ select: { id: true, userId: true } })
      : [],
    audienceDrivers ? prisma.driver.findMany({ select: { userId: true } }) : [],
    audienceAdmins ? prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } }) : [],
  ]);

  const userIds = new Set<string>();
  customers.forEach((c) => userIds.add(c.id));
  vendors.forEach((v) => v.userId && userIds.add(v.userId));
  drivers.forEach((d) => d.userId && userIds.add(d.userId));
  admins.forEach((a) => userIds.add(a.id));

  for (const userId of userIds) {
    messages.push({
      userId,
      type: 'admin_broadcast',
      title: input.title.slice(0, 100),
      body: input.body.slice(0, 1000),
    });
  }

  if (messages.length > 0) {
    await prisma.notification.createMany({
      data: messages,
      skipDuplicates: true,
    });
  }

  return {
    id: `${Date.now()}`,
    title: input.title,
    body: input.body,
    audience: input.audience,
    type: input.type ?? 'announcement',
    sent: true,
    createdAt: new Date().toISOString(),
  };
}