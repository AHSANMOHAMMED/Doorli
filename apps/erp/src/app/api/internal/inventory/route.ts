import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouseStock } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');
    const productId = url.searchParams.get('productId'); // Maps to ERP itemId

    if (!tenantId || !productId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch aggregate inventory from ERP warehouseStock across all warehouses for this tenant and item
    const stockResult = await db
      .select({
        totalStock: sql<number>`COALESCE(SUM(${warehouseStock.currentStock}), 0)`,
      })
      .from(warehouseStock)
      .where(
        and(
          eq(warehouseStock.tenantId, tenantId),
          eq(warehouseStock.itemId, productId)
        )
      );

    const stock = Number(stockResult[0]?.totalStock || 0);

    return NextResponse.json({ success: true, stock });
  } catch (error) {
    console.error('ERP Internal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
