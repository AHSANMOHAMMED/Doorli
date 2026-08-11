import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  tenants,
  subscriptions,
  pricingTiers,
  moduleAccess,
  systemSettings,
  userRoleEnum,
} from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'

/**
 * Shared helpers for the centralized super-admin control channel
 * (/api/internal/control/**). All callers must present the internal secret.
 */

export function verifyInternalControlSecret(req: NextRequest | Request): boolean {
  const authHeader = req.headers.get('x-internal-secret')
  return !!process.env.ERP_INTERNAL_SECRET && authHeader === process.env.ERP_INTERNAL_SECRET
}

export const ERP_USER_ROLES = userRoleEnum.enumValues as string[]

type Json = Record<string, unknown>

/**
 * Fetch a raw tenant row or null (not scoped by RLS — sys-control style reads).
 */
export async function findTenant(tenantId: string) {
  return db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })
}

export async function findSubscription(tenantId: string) {
  if (!tenantId) return null
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.tenantId, tenantId),
    with: { tier: true },
  })
}

export async function findTierByName(name: string) {
  return db.query.pricingTiers.findFirst({
    where: and(eq(pricingTiers.name, name), eq(pricingTiers.isActive, true)),
  })
}

export async function upsertSystemSetting(
  key: string,
  value: Json,
  description?: string,
) {
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  })

  if (existing) {
    return db.update(systemSettings)
      .set({ value, description: description ?? existing.description, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning()
  }

  return db.insert(systemSettings)
    .values({ key, value, description })
    .returning()
}

/**
 * Apply a module on/off control.
 * - tenantId provided → write module_access rows for that tenant.
 * - tenantId omitted → store a global default in system_settings (module_access_<key>).
 * `role` optional; when omitted the write applies to every built-in role.
 */
export async function applyModuleToggle(input: {
  tenantId?: string | null
  moduleKey: string
  role?: string | null
  isEnabled: boolean
}) {
  const { tenantId, moduleKey, role, isEnabled } = input

  if (!tenantId) {
    const rows = await upsertSystemSetting(
      `module_access_${moduleKey}`,
      { isEnabled, scope: 'all', updatedAt: new Date().toISOString() },
      `Global module toggle for ${moduleKey}`,
    )
    return { global: rows[0] }
  }

  const roles = role ? [role] : ERP_USER_ROLES
  const written: unknown[] = []

  for (const r of roles) {
    const existing = await db.query.moduleAccess.findFirst({
      where: and(
        eq(moduleAccess.tenantId, tenantId),
        eq(moduleAccess.moduleKey, moduleKey),
        eq(moduleAccess.role, r as (typeof userRoleEnum.enumValues)[number]),
      ),
    })

    if (existing) {
      const [row] = await db.update(moduleAccess)
        .set({ isEnabled, updatedAt: new Date(), updatedBy: null })
        .where(eq(moduleAccess.id, existing.id))
        .returning()
      written.push(row)
    } else {
      const [row] = await db.insert(moduleAccess)
        .values({
          tenantId,
          moduleKey,
          role: r as (typeof userRoleEnum.enumValues)[number],
          isEnabled,
        })
        .returning()
      written.push(row)
    }
  }

  return { tenantId, moduleKey, roles, isEnabled, written }
}

/**
 * Effective limits for a tenant — the values the super-admin console shows and the
 * ones account/usage honors (override columns win over the pricing tier).
 */
export function effectiveLimits(sub: Awaited<ReturnType<typeof findSubscription>>) {
  const tier = sub?.tier as unknown as { maxUsers?: number | null; maxSalesMonthly?: number | null; maxDatabaseBytes?: number | null; maxFileStorageBytes?: number | null }
  return {
    maxUsers: sub?.overrideMaxUsers ?? tier?.maxUsers ?? null,
    maxSalesMonthly: sub?.overrideMaxSalesMonthly ?? tier?.maxSalesMonthly ?? null,
    maxDatabaseBytes: sub?.overrideDatabaseBytes ?? tier?.maxDatabaseBytes ?? null,
    maxFileStorageBytes: sub?.overrideFileStorageBytes ?? tier?.maxFileStorageBytes ?? null,
    tierName: sub?.tier?.name ?? null,
    tierDisplayName: sub?.tier?.displayName ?? null,
  }
}

export async function listTenantsForControl() {
  const rows = await db.query.tenants.findMany({
    orderBy: [asc(tenants.createdAt)],
    columns: {
      id: true,
      name: true,
      slug: true,
      email: true,
      businessType: true,
      status: true,
      plan: true,
      planExpiresAt: true,
      aiEnabled: true,
      createdAt: true,
    },
  })

  const subs = await db.query.subscriptions.findMany()
  const byTenant = new Map(subs.map((s) => [s.tenantId, s]))

  return rows.map((t) => {
    const sub = byTenant.get(t.id)
    const limits = sub
      ? effectiveLimits({ ...sub, tier: (sub as unknown as { tier?: unknown }).tier })
      : { maxUsers: null, maxSalesMonthly: null, maxDatabaseBytes: null, maxFileStorageBytes: null, tierName: null, tierDisplayName: null }
    return {
      ...t,
      planExpiresAt: t.planExpiresAt?.toISOString() ?? null,
      createdAt: t.createdAt?.toISOString() ?? null,
      limits,
      subscription: sub
        ? {
            status: sub.status,
            overrideMaxUsers: sub.overrideMaxUsers,
            overrideMaxSalesMonthly: sub.overrideMaxSalesMonthly,
            overrideDatabaseBytes: sub.overrideDatabaseBytes,
            overrideFileStorageBytes: sub.overrideFileStorageBytes,
          }
        : null,
    }
  })
}