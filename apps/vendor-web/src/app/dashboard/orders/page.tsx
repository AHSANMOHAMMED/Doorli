'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search } from 'lucide-react';
import { apiFetch, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, TableShell, EmptyState, LoadingBlock, ErrorNote, Badge } from '@/components/console';
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

const FILTERS = ['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const;

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

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
      setError('Access denied: you must be a vendor to view this page.');
      setLoading(false);
      return;
    }

    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status.toLowerCase() !== filter) return false;
      if (!q) return true;
      return [o.orderNumber, o.id, o.customer?.fullName, o.customer?.phone]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [orders, query, filter]);

  if (authLoading || loading) {
    return (
      <>
        <PageHeader title="Orders" subtitle="Loading…" />
        <LoadingBlock rows={4} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Orders" />
        <ErrorNote>{error}</ErrorNote>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Manage and fulfil incoming orders."
        actions={<Badge tone="info">{orders.length} total</Badge>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-doorli-dim" />
          <input
            className="w-full py-2.5 pl-10 pr-3 text-sm"
            placeholder="Search order or customer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-white/[0.12] text-white'
                  : 'border border-white/[0.08] text-doorli-muted hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={20} />}
          title={orders.length === 0 ? 'No orders yet' : 'Nothing matches those filters'}
          desc={
            orders.length === 0
              ? 'New orders from the marketplace will land here in real time.'
              : 'Try a different status or clear the search.'
          }
        />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th className="text-right">Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          }
        >
          {visible.map((order) => (
            <tr key={order.id}>
              <td className="font-mono text-xs font-semibold">{order.orderNumber ?? order.id.slice(0, 8)}</td>
              <td>
                <p className="text-doorli-text">{order.customer?.fullName ?? 'Customer'}</p>
                {order.customer?.phone && <p className="text-xs text-doorli-dim">{order.customer.phone}</p>}
              </td>
              <td className="max-w-[280px] text-doorli-muted">
                {(order.items ?? [])
                  .map((i) => `${i.product?.name ?? 'Item'} ×${i.quantity ?? 1}`)
                  .join(', ') || `${order.items?.length ?? 0} items`}
              </td>
              <td className="text-right font-semibold tabular-nums">
                LKR {Number(order.totalAmount).toFixed(0)}
              </td>
              <td>
                <OrderStatusUpdate orderId={order.id} currentStatus={order.status} onUpdated={load} />
              </td>
              <td className="whitespace-nowrap text-doorli-dim">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </>
  );
}
