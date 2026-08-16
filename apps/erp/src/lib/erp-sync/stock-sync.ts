import { db } from '@/lib/db'
import { items, warehouseStock } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

/**
 * ERP → marketplace stock push (Req 10.3).
 *
 * After any stock adjustment in the embedded ERP, push the item's aggregate
 * on-hand quantity (summed across warehouses) to the Doorli marketplace via
 * `POST /api/v1/erp-webhooks/stock-update`. The marketplace matches products
 * by `erp_tenant_id` + `sku`/`barcode`, so only items that are also listed on
 * the marketplace are affected — everything else is ignored server-side.
 *
 * Best-effort by design: never throws, never blocks the ERP response.
 */

const REQUEST_TIMEOUT_MS = 8000

/** Small delay so the surrounding DB transaction commits before we read totals. */
const PUSH_DELAY_MS = 500

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
 * Push a single product stock update to the Doorli marketplace (Req 10.3).
 * Identified by `productId` (marketplace UUID) and `vendorId`.
 *
 * Best-effort: catches all errors, logs them, and never throws.
 */
export async function pushStockUpdate(
  productId: string,
  vendorId: string,
  newQuantity: number,
): Promise<void> {
  const base = marketplaceBaseUrl()
  if (!base) {
    console.warn('[erp-sync] MARKETPLACE_API_URL not configured — skipping stock push')
    return
  }

  try {
    const res = await fetch(`${base}/api/v1/erp-webhooks/stock-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${erpSecret()}`,
        // Also send as x-erp-secret header as per API contract
        'x-erp-secret': erpSecret(),
      },
      body: JSON.stringify({
        productId,
        vendorId,
        newStockQuantity: Math.max(0, Math.floor(newQuantity)),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`[erp-sync] pushStockUpdate rejected for product ${productId}: ${res.status}`)
    }
  } catch (err) {
    console.warn(
      `[erp-sync] pushStockUpdate unreachable for product ${productId}:`,
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Fire-and-forget: schedule a stock push for the given items.
 * Safe to call from inside a transaction — the push reads committed DB state.
 */
export function pushStockForItems(tenantId: string, itemIds: string[]): void {
  const unique = [...new Set(itemIds)].filter(Boolean)
  if (unique.length === 0) return
  setTimeout(() => {
    void doPush(tenantId, unique).catch((err) => {
      console.warn('[erp-sync] stock push failed:', err instanceof Error ? err.message : err)
    })
  }, PUSH_DELAY_MS)
}

async function doPush(tenantId: string, itemIds: string[]): Promise<void> {
  const base = marketplaceBaseUrl()
  if (!base) return // marketplace bridge not configured on this node

  // Aggregate on-hand stock across all warehouses per item.
  const rows = await db
    .select({
      itemId: items.id,
      sku: items.sku,
      barcode: items.barcode,
      totalStock: sql<string>`coalesce(sum(${warehouseStock.currentStock}), 0)`,
    })
    .from(items)
    .leftJoin(warehouseStock, eq(warehouseStock.itemId, items.id))
    .where(and(eq(items.tenantId, tenantId), inArray(items.id, itemIds)))
    .groupBy(items.id, items.sku, items.barcode)

  for (const row of rows) {
    // Without a SKU or barcode the marketplace cannot match the product.
    if (!row.sku && !row.barcode) continue
    try {
      const res = await fetch(`${base}/api/v1/erp-webhooks/stock-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${erpSecret()}`,
          'x-erp-secret': erpSecret(),
        },
        body: JSON.stringify({
          erp_tenant_id: tenantId,
          sku: row.sku || undefined,
          barcode: row.barcode || undefined,
          newStockQuantity: Math.max(0, Math.floor(parseFloat(row.totalStock) || 0)),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (!res.ok) {
        console.warn(`[erp-sync] stock-update rejected for item ${row.itemId}: ${res.status}`)
      }
    } catch (err) {
      console.warn(
        `[erp-sync] stock-update unreachable for item ${row.itemId}:`,
        err instanceof Error ? err.message : err,
      )
    }
  }
}
