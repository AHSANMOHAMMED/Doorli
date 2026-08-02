import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

const REQUEST_TIMEOUT_MS = 15000

function marketplaceBaseUrl(): string | null {
  const url = process.env.MARKETPLACE_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  return url ? url.replace(/\/$/, '') : null
}

function erpSecret(): string {
  if (!process.env.ERP_INTERNAL_SECRET) {
    throw new Error('ERP_INTERNAL_SECRET environment variable is required')
  }
  return process.env.ERP_INTERNAL_SECRET.replace(/^Bearer\s+/i, '')
}

/**
 * POST /api/internal/customer-sync — Sync ERP customers to the marketplace.
 *
 * Fetches customers for a given tenant and POSTs them to the marketplace
 * customer-sync webhook for upsert.
 *
 * Auth: x-internal-secret header must match ERP_INTERNAL_SECRET.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret')
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const tenantId = body.tenantId as string | undefined

    const base = marketplaceBaseUrl()
    if (!base) {
      return NextResponse.json({ error: 'MARKETPLACE_API_URL not configured' }, { status: 500 })
    }

    // Build query: fetch customers
    const whereConditions = []
    if (tenantId) {
      whereConditions.push(eq(customers.tenantId, tenantId))
    }

    const customerList = await db
      .select({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    // Batch customers for the webhook
    const batchSize = 50
    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < customerList.length; i += batchSize) {
      const batch = customerList.slice(i, i + batchSize)

      const payload = batch.map(c => ({
        erp_customer_id: c.id,
        name: c.name,
        phone: c.phone || undefined,
        email: c.email || undefined,
      }))

      try {
        const res = await fetch(`${base}/api/v1/erp-webhooks/customer-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${erpSecret()}`,
          },
          body: JSON.stringify({
            erp_tenant_id: tenantId,
            customers: payload,
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (res.ok) {
          synced += batch.length
        } else {
          failed += batch.length
          const text = await res.text().catch(() => '')
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${res.status} ${text}`)
        }
      } catch (err) {
        failed += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err instanceof Error ? err.message : 'network error'}`)
      }
    }

    console.log(`[ERP Customer Sync] Synced ${synced}/${customerList.length} customers to marketplace`)
    return NextResponse.json({
      success: true,
      total: customerList.length,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[ERP Customer Sync] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
