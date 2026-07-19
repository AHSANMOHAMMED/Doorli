'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
}

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  specialInstructions?: string | null;
  items?: Array<{ quantity: number; product?: { name: string }; notes?: string | null }>;
  createdAt: string;
};

const COLUMNS = ['pending', 'confirmed', 'preparing', 'ready'] as const;

export default function KitchenBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(getToken() || '');
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const res = await fetch(`${getApiBase()}/api/v1/orders/vendor/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setOrders(json.data?.items ?? json.data ?? []);
    };
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [token]);

  async function setStatus(orderId: string, status: string) {
    await fetch(`${getApiBase()}/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
      <p className="text-slate-500">Live order board — auto-refreshes every 8s.</p>
      {!token && (
        <p className="text-amber-600 text-sm">
          <a className="underline" href="/login">
            Sign in
          </a>{' '}
          as a vendor to load orders.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} className="bg-slate-50 rounded-2xl p-4 min-h-[420px]">
            <h2 className="font-semibold capitalize mb-3 text-slate-700">{col.replace('_', ' ')}</h2>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status === col)
                .map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border p-3 shadow-sm">
                    <div className="font-bold">#{o.orderNumber}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {(o.items ?? []).map((i) => `${i.quantity}x ${i.product?.name ?? 'item'}`).join(', ')}
                    </div>
                    {o.specialInstructions && (
                      <div className="text-xs text-amber-700 mt-2">{o.specialInstructions}</div>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {col === 'pending' && (
                        <button type="button" className="text-sm min-h-11 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium" onClick={() => setStatus(o.id, 'confirmed')}>
                          Confirm
                        </button>
                      )}
                      {col === 'confirmed' && (
                        <button type="button" className="text-sm min-h-11 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium" onClick={() => setStatus(o.id, 'preparing')}>
                          Preparing
                        </button>
                      )}
                      {col === 'preparing' && (
                        <button type="button" className="text-sm min-h-11 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium" onClick={() => setStatus(o.id, 'ready')}>
                          Ready
                        </button>
                      )}
                      {col === 'ready' && (
                        <button type="button" className="text-sm min-h-11 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium" onClick={() => setStatus(o.id, 'out_for_delivery')}>
                          Out for delivery
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
