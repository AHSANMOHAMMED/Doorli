import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/db/schema'
import { logError } from '@/lib/ai/error-logger'
import {
  listTenantsForControl,
  verifyInternalControlSecret,
} from '@/lib/admin/control'

// GET /api/internal/control — status snapshot consumed by the marketplace
// super-admin control plane: tenants (status/plan/limits) + global system settings.
export async function GET(request: NextRequest) {
  try {
    if (!verifyInternalControlSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const settings = await db.query.systemSettings.findMany()
    const globalModuleToggles: Record<string, { isEnabled: boolean }> = {}
    for (const s of settings) {
      if (s.key.startsWith('module_access_')) {
        globalModuleToggles[s.key.replace(/^module_access_/, '')] = {
          isEnabled: (s.value as { isEnabled?: boolean })?.isEnabled ?? true,
        }
      }
    }

    const tenants = await listTenantsForControl()

    return NextResponse.json({
      success: true,
      data: {
        settings,
        globalModuleToggles,
        tenants: tenantId ? tenants.filter((t) => t.id === tenantId) : tenants,
      },
    })
  } catch (error) {
    logError('api/internal/control', error)
    return NextResponse.json({ error: 'Failed to read control state' }, { status: 500 })
  }
}