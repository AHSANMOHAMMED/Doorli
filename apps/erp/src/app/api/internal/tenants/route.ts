import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, accounts, accountTenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { vendorId, businessName, adminEmail, phone, currency } = payload;

    if (!vendorId || !businessName) {
      return NextResponse.json(
        { error: 'vendorId and businessName are required' },
        { status: 400 },
      );
    }

    // Generate a slug from the vendorId and business name
    const slug = `mkp-${vendorId}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const tenantId = uuidv4();

    await db.transaction(async (tx) => {
      // Create the tenant
      await tx.insert(tenants).values({
        id: tenantId,
        name: businessName,
        slug,
        email: adminEmail || `admin@${slug}.doorli.app`,
        phone: phone || null,
        businessType: 'retail',
        currency: currency || 'LKR',
        plan: 'trial',
        status: 'active',
      });
    });

    return NextResponse.json({
      success: true,
      tenantId,
      message: 'Tenant provisioned successfully',
    });
  } catch (error) {
    console.error('ERP Internal API Error (tenants):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
