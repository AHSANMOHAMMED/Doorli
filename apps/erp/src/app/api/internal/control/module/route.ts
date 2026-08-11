import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/ai/error-logger'
import { addModuleKeys } from '@/lib/module-registry'
import { applyModuleToggle, verifyInternalControlSecret } from '@/lib/admin/control'
import { validateBody } from '@/lib/validation/helpers'
import { z } from 'zod'

const moduleToggleSchema = z.object({
  // Omit tenantId for a global (all-tenants) default; provide it for a per-tenant override.
  tenantId: z.string().uuid().nullable().optional(),
  moduleKey: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(60).nullable().optional(),
  isEnabled: z.boolean(),
})

// POST /api/internal/control/module
// One-click on/off for an ERP module, globally or for a single tenant.
export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalControlSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await validateBody(request, moduleToggleSchema)
    if (!parsed.success) return parsed.response
    const { tenantId, moduleKey, role, isEnabled } = parsed.data

    await addModuleKeys(moduleKey)

    const result = await applyModuleToggle({ tenantId, moduleKey, role, isEnabled })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logError('api/internal/control/module', error)
    return NextResponse.json({ error: 'Failed to toggle module' }, { status: 500 })
  }
}