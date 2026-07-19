'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Truck, Loader as Loader2 } from 'lucide-react';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  deliveryFee?: number | string;
  createdAt: string;
  customer?: { fullName?: string; phone?: string };
  deliveryAddress?: { addressLine?: string } | null;
  driver?: { fullName?: string; phone?: string } | null;
};

export default function DeliveriesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !profile) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ items: Order[] }>('/orders/vendor/mine');
        const items = res.data?.items ?? [];
        setOrders(
          items.filter((o) =>
            ['ready', 'picked_up', 'delivered'].includes(o.status),
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load deliveries');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, profile]);

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading deliveries...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-6 h-6" /> Deliveries
        </h1>
        <p className="text-slate-500 mt-1">Orders ready for pickup or out for delivery</p>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
      {orders.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border rounded-lg bg-white">
          No active deliveries.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
              <div>
                <div className="font-semibold">#{o.orderNumber}</div>
                <div className="text-sm text-slate-500 mt-1 capitalize">
                  {o.status.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  {o.customer?.fullName ?? 'Customer'}
                  {o.deliveryAddress?.addressLine
                    ? ` · ${o.deliveryAddress.addressLine}`
                    : ''}
                </div>
                {o.driver && (
                  <div className="text-sm text-slate-500 mt-1">
                    Driver: {o.driver.fullName} {o.driver.phone ?? ''}
                  </div>
                )}
              </div>
              <div className="text-right font-semibold">
                LKR {Number(o.totalAmount).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
