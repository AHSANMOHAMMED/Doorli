import { NextRequest, NextResponse } from 'next/server'
import { withAuthTenantTransaction } from '@/lib/db'
import { requirePermission } from '@/lib/auth/roles'
import { warehouseStock, stockMovements, items } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logAndBroadcast } from '@/lib/websocket/broadcast'
import { requireQuota } from '@/lib/db/storage-quota'
import { validateBody } from '@/lib/validation/helpers'
import { z } from 'zod'
import { postStockAdjustmentToGL } from '@/lib/accounting/auto-post'
import { pushStockForItems } from '@/lib/erp-sync/stock-sync'

const singleStockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  newQuantity: z.number().min(0),
  reason: z.string().optional(),
})

// POST - Apply a single stock adjustment
export async function POST(request: NextRequest) {
  const parsed = await validateBody(request, singleStockAdjustmentSchema)
  if (!parsed.success) return parsed.response
  const body = parsed.data

  const result = await withAuthTenantTransaction(async (session, tx) => {
    const permError = requirePermission(session, 'manageInventory')
    if (permError) return { error: permError }

    const quotaError = await requireQuota(session.user.tenantId, 'standard')
    if (quotaError) return { error: quotaError }

    // Lock and update warehouse stock
    const [existingStock] = await tx.select()
      .from(warehouseStock)
      .where(and(
        eq(warehouseStock.itemId, body.itemId),
        eq(warehouseStock.warehouseId, body.warehouseId)
      ))
      .for('update')

    if (!existingStock) {
      return { error: NextResponse.json({ error: 'No stock record found for this item in this warehouse' }, { status: 404 }) }
    }

    const currentQty = parseFloat(existingStock.currentStock)
    const variance = body.newQuantity - currentQty

    if (variance === 0) {
      return { data: { adjusted: 0, variance: 0 } }
    }

    await tx.update(warehouseStock)
      .set({
        currentStock: body.newQuantity.toString(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, existingStock.id))

    // Create stock movement record
    const [movement] = await tx.insert(stockMovements).values({
      tenantId: session.user.tenantId,
      warehouseId: body.warehouseId,
      itemId: body.itemId,
      type: 'adjustment',
      quantity: Math.abs(variance).toString(),
      referenceType: 'single_adjustment',
      notes: body.reason || `Stock adjustment: ${variance > 0 ? '+' : ''}${variance} units`,
      createdBy: session.user.id,
    }).returning()

    // Post stock adjustment to GL (only if item has a cost price)
    const [item] = await tx.select({ name: items.name, costPrice: items.costPrice })
      .from(items).where(eq(items.id, body.itemId)).limit(1)

    if (item) {
      const costPrice = parseFloat(item.costPrice || '0')
      if (costPrice > 0 && variance !== 0) {
        try {
          await postStockAdjustmentToGL(tx, session.user.tenantId, {
            adjustmentId: movement.id,
            tenantId: session.user.tenantId,
            itemName: item.name,
            quantityChange: variance,
            costPrice,
            notes: body.reason || `Stock adjustment: ${variance > 0 ? '+' : ''}${variance} units`,
          })
        } catch (glErr) {
          console.warn(`[GL] Failed to post stock adjustment for item ${body.itemId}:`, glErr)
        }
      }
    }

    logAndBroadcast(session.user.tenantId, 'warehouse-stock', 'updated', existingStock.id)
    logAndBroadcast(session.user.tenantId, 'stock-movement', 'created', movement.id)

    // Push adjusted quantity to marketplace (post-commit, best-effort)
    pushStockForItems(session.user.tenantId, [body.itemId])

    return { data: { adjusted: 1, variance } }
  })

  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ('error' in result) return result.error
  return NextResponse.json(result.data)
}
