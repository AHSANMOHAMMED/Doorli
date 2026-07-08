import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
// Assuming posSales or a similar table exists in the ERP schema for orders
import { posSales } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tenantId, items, customerInfo, totalAmount } = payload;

    // Simulate inserting an order into the ERP's sales table
    // In reality, this would map to the ERP's specific order schema
    // await db.insert(posSales).values({
    //   tenantId,
    //   total: totalAmount,
    //   status: 'Completed',
    //   // ...other fields
    // });

    return NextResponse.json({ success: true, message: 'Order synced to ERP successfully' });
  } catch (error) {
    console.error('ERP Internal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
