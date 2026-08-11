import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logError } from '@/lib/ai/error-logger'
import { findTenant, verifyInternalControlSecret } from '@/lib/admin/control'
import { validateBody } from '@/lib/validation/helpers'
import { z } from 'zod'

const tenantControlSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'locked', 'cancelled']).optional(),
  statusReason: z.string().max(200).optional(),
  plan: z.enum(['trial', 'basic', 'standard', 'premium']).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
  aiEnabled: z.boolean().optional(),
})

// POST /api/internal/control/tenant
// One-click enable/disable/freeze an ERP tenant, change its plan, or grant AI.
export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalControlSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await validateBody(request, tenantControlSchema)
    if (!parsed.success) return parsed.response
    const { tenantId, status, statusReason, plan, planExpiresAt, aiEnabled } = parsed.data

    const tenant = await findTenant(tenantId)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (status !== undefined) update.status = status
    if (plan !== undefined) update.plan = plan
    if (planExpiresAt !== undefined) update.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null
    if (aiEnabled !== undefined) {
      update.aiEnabled = aiEnabled
      if (aiEnabled) update.aiConsentAcceptedAt = new Date()
    }

    // Track lock/suspend metadata for super-admin transparency
    if (status === 'locked' || status === 'suspended' || status === 'cancelled') {
      update.lockedAt = new Date()
      update.lockedReason = statusReason ? String(statusReason).slice(0, 50) : `super_admin_${status}`
    } else if (status === 'active') {
      // Re-enabling clears the lock state
      update.lockedAt = null
      update.lockedReason = null
    }

    const [updated] = await db.update(tenants)
      .set(update)
      .where(eq(tenants.id, tenantId))
      .returning({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        plan: tenants.plan,
        planExpiresAt: tenants.planExpiresAt,
        aiEnabled: tenants.aiEnabled,
        lockedReason: tenants.lockedReason,
      })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    logError('api/internal/control/tenant', error)
    return NextResponse.json({ error: 'Failed to apply tenant control' }, { status: 500 })
  }
}