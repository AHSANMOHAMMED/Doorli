import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tenantId, erpOrderId, marketplaceOrderId, status } = payload;

    if (!tenantId || !marketplaceOrderId || !status) {
      return NextResponse.json(
        { error: 'tenantId, marketplaceOrderId, and status are required' },
        { status: 400 },
      );
    }

    // Map marketplace status to ERP sale status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      confirmed: 'pending',
      processing: 'pending',
      shipped: 'completed',
      delivered: 'completed',
      completed: 'completed',
      cancelled: 'void',
      refunded: 'void',
    };

    const erpStatus = statusMap[status] || 'pending';

    // Find the sale by invoiceNo (erpOrderId) or by notes containing the marketplaceOrderId
    const conditions = [eq(sales.tenantId, tenantId)];
    if (erpOrderId) {
      conditions.push(eq(sales.invoiceNo, erpOrderId));
    }

    const [existingSale] = await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .limit(1);

    if (!existingSale) {
      return NextResponse.json(
        { success: false, error: 'Order not found in ERP' },
        { status: 404 },
      );
    }

    await db
      .update(sales)
      .set({ status: erpStatus as any })
      .where(eq(sales.id, existingSale.id));

    return NextResponse.json({
      success: true,
      message: 'Order status updated in ERP',
      erpSaleId: existingSale.id,
    });
  } catch (error) {
    console.error('ERP Internal API Error (order-status):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
