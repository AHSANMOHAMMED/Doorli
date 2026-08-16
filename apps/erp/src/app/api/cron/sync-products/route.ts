import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items, warehouseStock, tenants } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logError } from '@/lib/ai/error-logger'

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
 * POST /api/cron/sync-products — Periodically sync all ERP products to marketplace.
 *
 * Iterates over all active tenants, fetches their active items with aggregate
 * stock, and POSTs them to the marketplace product-sync webhook.
 *
 * Auth: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid CRON_SECRET.' },
        { status: 401 }
      )
    }

    const base = marketplaceBaseUrl()
    if (!base) {
      return NextResponse.json({ error: 'MARKETPLACE_API_URL not configured' }, { status: 500 })
    }

    // Get all active tenants
    const tenantList = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.status, 'active'))

    let totalSynced = 0
    let totalFailed = 0
    const tenantResults: { tenantId: string; synced: number; failed: number }[] = []

    for (const tenant of tenantList) {
      // Fetch active items with aggregate stock for this tenant
      const productList = await db
        .select({
          id: items.id,
          tenantId: items.tenantId,
          sku: items.sku,
          barcode: items.barcode,
          name: items.name,
          description: items.description,
          sellingPrice: items.sellingPrice,
          costPrice: items.costPrice,
          unit: items.unit,
          imageUrl: items.imageUrl,
          trackStock: items.trackStock,
          totalStock: sql<string>`coalesce(sum(${warehouseStock.currentStock}), 0)`,
        })
        .from(items)
        .leftJoin(warehouseStock, eq(warehouseStock.itemId, items.id))
        .where(and(eq(items.isActive, true), eq(items.tenantId, tenant.id)))
        .groupBy(items.id, items.tenantId, items.sku, items.barcode, items.name,
          items.description, items.sellingPrice, items.costPrice, items.unit,
          items.imageUrl, items.trackStock)

      if (productList.length === 0) continue

      const products = productList.map(p => ({
        erp_tenant_id: p.tenantId,
        erp_item_id: p.id,
        sku: p.sku || undefined,
        barcode: p.barcode || undefined,
        name: p.name,
        description: p.description || undefined,
        price: parseFloat(p.sellingPrice) || 0,
        cost_price: parseFloat(p.costPrice) || 0,
        unit: p.unit || 'pcs',
        image_url: p.imageUrl || undefined,
        stock_quantity: p.trackStock ? Math.max(0, Math.floor(parseFloat(p.totalStock) || 0)) : undefined,
        is_active: true,
      }))

      // Batch in groups of 50
      let tenantSynced = 0
      let tenantFailed = 0
      for (let i = 0; i < products.length; i += 50) {
        const batch = products.slice(i, i + 50)
        try {
          const res = await fetch(`${base}/api/v1/erp-webhooks/product-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${erpSecret()}`,
            },
            body: JSON.stringify({ products: batch }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          })
          if (res.ok) {
            tenantSynced += batch.length
          } else {
            tenantFailed += batch.length
          }
        } catch {
          tenantFailed += batch.length
        }
      }

      totalSynced += tenantSynced
      totalFailed += tenantFailed
      tenantResults.push({ tenantId: tenant.id, synced: tenantSynced, failed: tenantFailed })
    }

    console.log(`[Cron] Product sync: ${totalSynced} synced, ${totalFailed} failed across ${tenantList.length} tenants`)
    return NextResponse.json({
      success: true,
      tenantsProcessed: tenantList.length,
      totalSynced,
      totalFailed,
      results: tenantResults,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    logError('api/cron/sync-products', error)
    return NextResponse.json({ error: 'Failed to sync products' }, { status: 500 })
  }
}
