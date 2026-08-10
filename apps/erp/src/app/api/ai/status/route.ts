import { NextResponse } from 'next/server'
import { authWithCompany } from '@/lib/auth'
import { isAIEnabled, isAIEnabledForTenant, getTokenUsage, getLastError, getActiveProvider } from '@/lib/ai/gemini'

async function isAgentServiceReachable(): Promise<boolean> {
  const baseUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:4006'
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

export async function GET() {
  const session = await authWithCompany()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serverEnabled = isAIEnabled()
  const tenantEnabled = isAIEnabledForTenant(session)
  const agentEnabled = tenantEnabled ? await isAgentServiceReachable() : false

  return NextResponse.json({
    enabled: tenantEnabled || agentEnabled,
    serverEnabled: serverEnabled || agentEnabled,
    tenantEnabled: session.user.aiEnabled,
    provider: agentEnabled ? 'agent' : tenantEnabled ? getActiveProvider() : null,
    usage: tenantEnabled ? getTokenUsage() : null,
    lastError: tenantEnabled ? getLastError() : null,
  })
}
