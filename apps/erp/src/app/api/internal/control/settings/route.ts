import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/ai/error-logger'
import { upsertSystemSetting, verifyInternalControlSecret } from '@/lib/admin/control'
import { validateBody } from '@/lib/validation/helpers'
import { z } from 'zod'

const overrideSettingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.record(z.string(), z.unknown()),
  description: z.string().max(300).optional(),
})

// POST /api/internal/control/settings
// One-click upsert of a global ERP system setting (e.g. system_announcement).
export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalControlSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await validateBody(request, overrideSettingSchema)
    if (!parsed.success) return parsed.response
    const { key, value, description } = parsed.data

    const [row] = await upsertSystemSetting(key, value, description)

    return NextResponse.json({ success: true, data: row })
  } catch (error) {
    logError('api/internal/control/settings', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}