import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sales, saleItems, payments, items as itemsSchema } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tenantId, items, customerInfo, totalAmount } = payload;

    const invoiceNo = `MKP-ORDER-${Date.now()}`;

    await db.transaction(async (tx) => {
      // 1. Insert into Sales
      const [newSale] = await tx
        .insert(sales)
        .values({
          tenantId,
          invoiceNo,
          total: totalAmount,
          subtotal: totalAmount,
          status: 'completed',
          notes: 'Marketplace Order',
          customerName: customerInfo?.name || 'Marketplace Customer',
          paymentMethod: 'card', // Assume online payment
        })
        .returning();

      // 2. Insert Sale Items
      if (items && items.length > 0) {
        // First, ensure all items exist in the ERP's inventory catalog.
        // For a marketplace integration, we auto-create the stub items if they don't exist yet.
        const itemsToUpsert = items.map((item: any) => ({
          id: item.productId,
          tenantId,
          name: item.name || 'Marketplace Item',
          type: 'product', // basic default
          category: 'marketplace', // generic category
          status: 'active',
          trackInventory: false,
          basePrice: String(item.price),
        }));

        await tx.insert(itemsSchema)
          .values(itemsToUpsert)
          .onConflictDoNothing({ target: itemsSchema.id });

        const saleItemsData = items.map((item: any) => ({
          tenantId,
          saleId: newSale.id,
          itemId: item.productId,
          itemName: item.name || 'Marketplace Item',
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price,
        }));
        
        await tx.insert(saleItems).values(saleItemsData);
      }

      // 3. Insert Payment record to close the sale
      await tx.insert(payments).values({
        tenantId,
        saleId: newSale.id,
        amount: totalAmount,
        method: 'card',
        reference: invoiceNo,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Order synced to ERP successfully',
      invoiceNo,
      saleId: invoiceNo,
    });
  } catch (error) {
    console.error('ERP Internal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
