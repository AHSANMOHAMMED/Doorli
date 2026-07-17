'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    const t = localStorage.getItem('doorli_vendor_token') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const res = await fetch(`${API}/api/v1/orders/vendor/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // fallback: use admin-style list if vendor endpoint missing
      if (!res.ok) return;
      const json = await res.json();
      setOrders(json.data?.items ?? json.data ?? []);
    };
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [token]);

  async function setStatus(orderId: string, status: string) {
    await fetch(`${API}/api/v1/orders/${orderId}/status`, {
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
      <p className="text-slate-500">Live order board for restaurants — auto-refreshes every 8s.</p>
      {!token && (
        <p className="text-amber-600 text-sm">Set localStorage doorli_vendor_token to load orders.</p>
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
                        <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded" onClick={() => setStatus(o.id, 'confirmed')}>
                          Confirm
                        </button>
                      )}
                      {col === 'confirmed' && (
                        <button className="text-xs bg-indigo-600 text-white px-2 py-1 rounded" onClick={() => setStatus(o.id, 'preparing')}>
                          Prep
                        </button>
                      )}
                      {col === 'preparing' && (
                        <button className="text-xs bg-emerald-600 text-white px-2 py-1 rounded" onClick={() => setStatus(o.id, 'ready')}>
                          Ready
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
