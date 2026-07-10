import { createClient } from '@/lib/supabase/server';
import { prisma } from '@doorli/db';
import { redirect } from 'next/navigation';
import OrderStatusUpdate from './OrderStatusUpdate';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to determine role
  const profile = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!profile || profile.role !== 'vendor') {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">
        Access Denied: You must be a vendor to view this page.
      </div>
    );
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id }
  });

  if (!vendor) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">
        No vendor profile found. Please complete onboarding first.
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { fullName: true, phone: true } },
      items: {
        include: { product: true }
      },
    }
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">Manage and fulfill your incoming orders</p>
      </div>

      <div className="card overflow-hidden border rounded-lg shadow-sm bg-white mt-8">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Order #</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Customer</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Items</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Total</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {order.orderNumber ?? order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.customer?.fullName ?? 'Customer'}<br/>
                      <span className="text-xs text-slate-400">{order.customer?.phone}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          {item.quantity}x {item.product?.name ?? 'Unknown'}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
