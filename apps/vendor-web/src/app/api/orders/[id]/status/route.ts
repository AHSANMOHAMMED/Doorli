import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@doorli/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const orderId = params.id;

    if (!status || !orderId) {
      return NextResponse.json({ error: 'Missing status or orderId' }, { status: 400 });
    }

    // Verify the user is the vendor for this order
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.vendorId !== vendor.id) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
    }

    // Update order status in DB
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any } // Cast to OrderStatus enum
    });

    if (status === 'ready') {
      try {
        const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL || 'http://localhost:8086';
        await fetch(`${deliveryServiceUrl}/api/delivery/dispatch/${orderId}`, {
          method: 'POST',
        });
        console.log(`Successfully triggered dispatch for order ${orderId}`);
      } catch (err) {
        console.error('Failed to trigger delivery dispatch:', err);
        // We do not fail the request if dispatch fails to trigger, 
        // as the status update is already persisted.
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
