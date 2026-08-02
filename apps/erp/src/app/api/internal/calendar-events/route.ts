import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    if (authHeader !== process.env.ERP_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      tenantId,
      externalEventId,
      title,
      customerName,
      customerPhone,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      notes,
    } = payload;

    if (!tenantId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'tenantId, scheduledDate, and scheduledTime are required' },
        { status: 400 },
      );
    }

    // Try to find or create a customer if phone is provided
    let customerId: string | null = null;
    if (customerPhone && customerName) {
      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, tenantId),
            eq(customers.phone, customerPhone),
          ),
        )
        .limit(1);

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    // Check if an appointment with this externalEventId already exists (upsert behavior)
    if (externalEventId) {
      const [existing] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.tenantId, tenantId),
            eq(appointments.notes, `marketplace:${externalEventId}`),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing appointment
        await db
          .update(appointments)
          .set({
            scheduledDate,
            scheduledTime,
            durationMinutes: durationMinutes || existing.durationMinutes,
            customerName: customerName || existing.customerName,
            notes: `marketplace:${externalEventId}${notes ? ` - ${notes}` : ''}`,
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, existing.id));

        return NextResponse.json({
          success: true,
          appointmentId: existing.id,
          message: 'Calendar event updated in ERP',
        });
      }
    }

    // Create new appointment
    const appointmentId = uuidv4();
    await db.insert(appointments).values({
      id: appointmentId,
      tenantId,
      customerId: customerId as any,
      customerName: customerName || 'Marketplace Booking',
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes || 60,
      status: 'scheduled',
      notes: `marketplace:${externalEventId || 'manual'}${notes ? ` - ${notes}` : ''}`,
    });

    return NextResponse.json({
      success: true,
      appointmentId,
      message: 'Calendar event created in ERP',
    });
  } catch (error) {
    console.error('ERP Internal API Error (calendar-events):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
