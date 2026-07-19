'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import OrderStatusUpdate from './OrderStatusUpdate';

type Order = {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  customer?: { fullName?: string; phone?: string };
  items?: Array<{ product?: { name?: string }; quantity?: number }>;
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await apiFetch<{ items: Order[] }>('/orders/vendor/mine');
    setOrders(res.data?.items ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!getToken() || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'vendor' && user.role !== 'admin') {
      setError('Access Denied: You must be a vendor to view this page.');
      setLoading(false);
      return;
    }

    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return <div className="p-8 text-slate-500">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">{error}</div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">Manage and fulfill your incoming orders</p>
      </div>

      <div className="card overflow-hidden border rounded-lg shadow-sm bg-white mt-8">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No orders found.</div>
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
                      {order.customer?.fullName ?? 'Customer'}
                      {order.customer?.phone ? (
                        <div className="text-xs text-slate-400">{order.customer.phone}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {(order.items ?? [])
                        .map((i) => `${i.product?.name ?? 'Item'} ×${i.quantity ?? 1}`)
                        .join(', ') || `${order.items?.length ?? 0} items`}
                    </td>
                    <td className="px-6 py-4 font-medium">LKR {Number(order.totalAmount).toFixed(0)}</td>
                    <td className="px-6 py-4">
                      <OrderStatusUpdate
                        orderId={order.id}
                        currentStatus={order.status}
                        onUpdated={load}
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
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
