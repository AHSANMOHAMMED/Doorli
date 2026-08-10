import { NextRequest, NextResponse } from 'next/server'
import { authWithCompany } from '@/lib/auth'
import { isAIEnabledForTenant } from '@/lib/ai/gemini'
import { validateBody } from '@/lib/validation/helpers'
import { aiChatSchema } from '@/lib/validation/schemas/ai'

function getAgentServiceUrl(): string {
  return process.env.AI_SERVICE_URL || 'http://127.0.0.1:4006'
}

export async function POST(request: NextRequest) {
  const session = await authWithCompany()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAIEnabledForTenant(session)) {
    return NextResponse.json({ error: 'AI features are not enabled for this company.' }, { status: 403 })
  }

  const parsed = await validateBody(request, aiChatSchema)
  if (!parsed.success) return parsed.response

  const upstream = await fetch(`${getAgentServiceUrl()}/api/ai/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: parsed.data.message,
      userId: session.user.id,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Agent request failed' }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}