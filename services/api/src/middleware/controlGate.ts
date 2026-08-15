import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../lib/redis.js';
import type { MaintenanceWindow, ServiceKey } from '@doorli/types';

type CachedStates = Record<string, { enabled: boolean }>;

/**
 * Read current maintenance + service state straight from Redis (published by
 * the control plane when a super-admin toggles anything). No long-lived cache,
 * so controls take effect on the very next request.
 */
async function readControlState(): Promise<{ maintenance: MaintenanceWindow | null; services: CachedStates }> {
  const redis = getRedis();
  try {
    if (redis.status !== 'ready') await redis.connect();
    const [maintRaw, servicesRaw] = await redis.mget('ctl:maintenance', 'ctl:services');
    return {
      maintenance: maintRaw ? (JSON.parse(maintRaw) as MaintenanceWindow) : null,
      services: servicesRaw ? (JSON.parse(servicesRaw) as CachedStates) : {},
    };
  } catch {
    return { maintenance: null, services: {} };
  }
}

const PUBLIC_PATHS: Array<{ method?: string; path: RegExp }> = [
  { path: /^\/(health|api\/v1\/?$)/ },
  { path: /^\/api\/v1\/auth\/(login|register|otp|refresh|verify)/ },
];

function isPublic(path: string, method: string): boolean {
  return PUBLIC_PATHS.some((p) => {
    if (p.method && p.method !== method) return false;
    return p.path.test(path);
  });
}

function scopeMatches(scope: string, path: string): boolean {
  if (scope === 'all') return true;
  if (scope === 'marketplace') return path.startsWith('/api/v1/');
  if (scope === 'auth') return path.startsWith('/api/v1/auth');
  if (scope === 'delivery') return /^\/api\/v1\/(orders|drivers|payments)/.test(path);
  if (scope === 'notifications') return /^\/api\/v1\/(notifications)/.test(path);
  if (scope === 'search') return path.startsWith('/api/search');
  if (scope === 'gov') return path.startsWith('/api/v1/gov');
  if (scope === 'forum') return path.startsWith('/api/v1/forums');
  if (scope === 'emergency') return path.startsWith('/api/v1/emergency');
  if (scope === 'chat') return path.startsWith('/api/v1/chat');
  if (scope === 'ride_hailing') return path.startsWith('/api/v1/rides');
  if (scope === 'storage') return path.startsWith('/api/v1/storage');
  if (scope === 'ai') return path.startsWith('/api/v1/ai');
   if (scope === 'erp') return path.startsWith('/api/v1/erp') || path.startsWith('/api/v1/erp-webhooks');
  return false;
}

const SERVICE_PATH_MAP: Record<string, ServiceKey> = {
  '/api/v1/auth': 'auth',
  '/api/v1/orders': 'delivery',
  '/api/v1/drivers': 'delivery',
  '/api/v1/payments': 'delivery',
  '/api/v1/notifications': 'notifications',
  '/api/search': 'search',
  '/api/v1/search': 'search',
  '/api/v1/gov': 'gov',
  '/api/v1/forums': 'forum',
  '/api/v1/emergency': 'emergency',
  '/api/v1/rides': 'ride_hailing',
  '/api/v1/chat': 'chat',
  '/api/v1/ride_hailing': 'ride_hailing',
  '/api/v1/storage': 'storage',
  '/api/v1/ai': 'ai',
  '/api/v1/erp-webhooks': 'erp',
};

function serviceForPath(path: string): ServiceKey | null {
  for (const [prefix, key] of Object.entries(SERVICE_PATH_MAP)) {
    if (path.startsWith(prefix)) return key;
  }
  return 'marketplace';
}

export async function controlGate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isPublic(req.path, req.method)) return next();

    const { maintenance, services } = await readControlState();

    // Maintenance window
    if (maintenance?.active) {
      if (scopeMatches(maintenance.scope ?? 'all', req.path) && !req.path.startsWith('/api/v1/admin/control')) {
        res.status(503).json({
          success: false,
          error: 'maintenance_active',
          message: maintenance.message || 'Doors are temporarily closed. Please try again shortly.',
          data: { endsAt: maintenance.endsAt ?? null, scope: maintenance.scope ?? 'all' },
        });
        return;
      }
    }

    // Service enable/disable
    const service = serviceForPath(req.path);
    const state = services[`service:${service}`];
    if (state && !state.enabled) {
      res.status(403).json({
        success: false,
        error: 'service_disabled',
        message: `${service} is currently disabled by system administrators`,
      });
      return;
    }

    next();
  } catch {
    // Fail open when control data cannot be read
    next();
  }
}

export default controlGate;
