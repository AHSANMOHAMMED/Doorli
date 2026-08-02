import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items, warehouseStock, categories } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

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
 * POST /api/internal/product-sync — Sync ERP products to the marketplace.
 *
 * Fetches active items for a given tenant (or all tenants if none specified),
 * computes aggregate stock across warehouses, and POSTs each product to the
 * marketplace webhook for upsert.
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

    // Build query: fetch active items with aggregate stock
    const whereConditions = [eq(items.isActive, true)]
    if (tenantId) {
      whereConditions.push(eq(items.tenantId, tenantId))
    }

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
        categoryId: items.categoryId,
        totalStock: sql<string>`coalesce(sum(${warehouseStock.currentStock}), 0)`,
      })
      .from(items)
      .leftJoin(warehouseStock, eq(warehouseStock.itemId, items.id))
      .where(and(...whereConditions))
      .groupBy(items.id, items.tenantId, items.sku, items.barcode, items.name,
        items.description, items.sellingPrice, items.costPrice, items.unit,
        items.imageUrl, items.trackStock, items.categoryId)

    // Fetch category names for mapping
    const categoryIds = [...new Set(productList.map(p => p.categoryId).filter(Boolean))] as string[]
    let categoryMap: Record<string, string> = {}
    if (categoryIds.length > 0) {
      const cats = await db.select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(sql`${categories.id} IN ${categoryIds}`)
      categoryMap = Object.fromEntries(cats.map(c => [c.id, c.name]))
    }

    let synced = 0
    let failed = 0
    const errors: string[] = []

    // Batch products into chunks of 50 for efficient webhook calls
    const batchSize = 50
    for (let i = 0; i < productList.length; i += batchSize) {
      const batch = productList.slice(i, i + batchSize)

      const products = batch.map(p => ({
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
        category: p.categoryId ? (categoryMap[p.categoryId] || undefined) : undefined,
        stock_quantity: p.trackStock ? Math.max(0, Math.floor(parseFloat(p.totalStock) || 0)) : undefined,
        is_active: true,
      }))

      try {
        const res = await fetch(`${base}/api/v1/erp-webhooks/product-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${erpSecret()}`,
          },
          body: JSON.stringify({ products }),
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

    console.log(`[ERP Product Sync] Synced ${synced}/${productList.length} products to marketplace`)
    return NextResponse.json({
      success: true,
      total: productList.length,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[ERP Product Sync] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
