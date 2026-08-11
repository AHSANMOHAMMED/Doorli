import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logError } from '@/lib/ai/error-logger'
import {
  effectiveLimits,
  findSubscription,
  findTenant,
  findTierByName,
  verifyInternalControlSecret,
} from '@/lib/admin/control'
import { validateBody } from '@/lib/validation/helpers'
import { z } from 'zod'

const quotaOverrideSchema = z.object({
  tenantId: z.string().uuid(),
  maxUsers: z.number().int().min(0).nullable().optional(),
  maxSalesMonthly: z.number().int().min(0).nullable().optional(),
  maxDatabaseBytes: z.number().int().min(0).nullable().optional(),
  maxFileStorageBytes: z.number().int().min(0).nullable().optional(),
  tierName: z.string().min(1).nullable().optional(),
})

// POST /api/internal/control/quota
// One-click increase/reduce an ERP tenant's limits (users, sales, storage, DB).
// Pass a value to override; pass null to clear an override; omit to leave unchanged.
export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalControlSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await validateBody(request, quotaOverrideSchema)
    if (!parsed.success) return parsed.response
    const { tenantId, maxUsers, maxSalesMonthly, maxDatabaseBytes, maxFileStorageBytes, tierName } = parsed.data

    const tenant = await findTenant(tenantId)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const sub = await findSubscription(tenantId)
    if (!sub) {
      return NextResponse.json({ error: 'Tenant has no subscription' }, { status: 400 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (maxUsers !== undefined) update.overrideMaxUsers = maxUsers
    if (maxSalesMonthly !== undefined) update.overrideMaxSalesMonthly = maxSalesMonthly
    if (maxDatabaseBytes !== undefined) update.overrideDatabaseBytes = maxDatabaseBytes
    if (maxFileStorageBytes !== undefined) update.overrideFileStorageBytes = maxFileStorageBytes

    if (tierName) {
      const tier = await findTierByName(tierName)
      if (!tier) {
        return NextResponse.json({ error: `No active pricing tier '${tierName}'` }, { status: 400 })
      }
      update.tierId = tier.id
    }

    await db.update(subscriptions).set(update).where(eq(subscriptions.id, sub.id))

    const updated = await findSubscription(tenantId)
    return NextResponse.json({
      success: true,
      data: {
        tenantId,
        ...effectiveLimits(updated),
      },
    })
  } catch (error) {
    logError('api/internal/control/quota', error)
    return NextResponse.json({ error: 'Failed to apply quota override' }, { status: 500 })
  }
}