'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { TrendingUp, Loader as Loader2 } from 'lucide-react';

type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
};

export default function AnalyticsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ items: Order[] }>('/orders/vendor/mine');
        setOrders(res.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile]);

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics...
      </div>
    );
  }

  const completed = orders.filter((o) => o.status === 'delivered');
  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const revenue = completed.reduce((s, o) => s + Number(o.totalAmount), 0);
  const pending = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'].includes(o.status),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" /> Analytics
        </h1>
        <p className="text-slate-500 mt-1">Simple revenue and order metrics from your Doorli orders</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total orders" value={String(orders.length)} />
        <Stat label="Delivered" value={String(completed.length)} />
        <Stat label="In progress" value={String(pending)} />
        <Stat label="Cancelled" value={String(cancelled.length)} />
      </div>
      <div className="bg-white border rounded-xl p-6">
        <div className="text-sm text-slate-500">Gross revenue (delivered)</div>
        <div className="text-3xl font-bold mt-2">LKR {revenue.toLocaleString()}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
