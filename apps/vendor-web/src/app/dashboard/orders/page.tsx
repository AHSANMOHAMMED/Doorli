'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number;
  createdAt: string;
  items: OrderItem[];
  customer?: { fullName: string; phone: string };
}

const VENDOR_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [{ label: 'Confirm', next: 'confirmed' }],
  confirmed: [{ label: 'Start preparing', next: 'preparing' }],
  preparing: [{ label: 'Mark ready', next: 'ready' }],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const res = await apiFetch<Order[]>('/api/v1/orders/vendor');
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to load orders');
      return;
    }
    setOrders(res.data);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function advanceStatus(orderId: string, status: string) {
    const res = await apiFetch(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.success) load();
  }

  if (loading) return <p className="text-slate-500">Loading orders...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-slate-500">No orders yet. They will appear here when customers checkout.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const actions = VENDOR_ACTIONS[order.status] ?? [];
            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-slate-500">
                      {order.customer?.fullName ?? 'Customer'} · {order.customer?.phone}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <ul className="mt-3 text-sm text-slate-600">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">
                  LKR {Number(order.totalAmount).toLocaleString('en-LK')}
                </p>
                <div className="mt-4 flex gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.next}
                      type="button"
                      className="rounded-lg bg-doorli-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                      onClick={() => advanceStatus(order.id, action.next)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
