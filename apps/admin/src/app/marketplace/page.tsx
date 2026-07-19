'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  paymentStatus: string;
  createdAt: string;
  vendor?: { businessName?: string };
  customer?: { fullName?: string; phone?: string };
};

export default function MarketplaceTransactions() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
      return;
    }
    adminFetch('/admin/orders')
      .then((data) => setOrders(Array.isArray(data) ? data : data?.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Marketplace Transactions</h2>
        <p className="text-gray-500 mt-2">Recent orders from the Doorli marketplace API.</p>
      </div>
      {error && <p className="text-amber-600 text-sm">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customer?.fullName ?? '—'}</td>
                  <td className="px-4 py-3">{o.vendor?.businessName ?? '—'}</td>
                  <td className="px-4 py-3">LKR {Number(o.totalAmount).toFixed(0)}</td>
                  <td className="px-4 py-3 capitalize">{o.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 capitalize">{o.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-8 text-center text-gray-500">No marketplace orders yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
