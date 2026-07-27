'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Search, CircleDollarSign, ShoppingBag } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, StatCard, Badge, TableShell, EmptyState, Skeleton } from '@/components/ui';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  paymentStatus: string;
  createdAt: string;
  erpOrderId?: string | null;
  erpSyncStatus?: string | null;
  vendor?: { businessName?: string };
  customer?: { fullName?: string; phone?: string };
};

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (['delivered', 'completed', 'paid', 'succeeded'].includes(s)) return 'success';
  if (['cancelled', 'failed', 'refunded'].includes(s)) return 'danger';
  if (['pending', 'processing', 'preparing', 'unpaid'].includes(s)) return 'warning';
  return 'info';
}

export default function MarketplaceTransactions() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.orderNumber, o.vendor?.businessName, o.customer?.fullName, o.status]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q)),
    );
  }, [orders, query]);

  const gross = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const paid = orders.filter((o) => statusTone(o.paymentStatus) === 'success').length;

  return (
    <>
      <PageHeader title="Marketplace Transactions" subtitle="Recent orders flowing through the Doorli marketplace." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Orders" value={orders.length} hint="In this window" tone="blue" icon={<ShoppingBag size={17} />} delay="doorli-rise" />
        <StatCard label="Gross value" value={`LKR ${gross.toLocaleString()}`} hint="Sum of order totals" tone="teal" icon={<CircleDollarSign size={17} />} delay="doorli-rise-1" />
        <StatCard label="Payments settled" value={paid} hint={`of ${orders.length} orders`} tone="gold" icon={<Receipt size={17} />} delay="doorli-rise-2" />
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-doorli-dim" />
        <input
          className="input pl-10"
          placeholder="Search orders…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={20} />}
          title={query ? 'No orders match that search' : 'No marketplace orders yet'}
          desc={query ? 'Try an order number, vendor, or customer name.' : 'Orders will stream in here as customers check out.'}
        />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Vendor</th>
              <th className="text-right">Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>ERP sync</th>
            </tr>
          }
        >
          {filtered.map((o) => (
            <tr key={o.id}>
              <td>
                <p className="font-mono text-xs font-semibold text-white">{o.orderNumber}</p>
                {o.createdAt && (
                  <p className="text-xs text-doorli-dim">{new Date(o.createdAt).toLocaleDateString()}</p>
                )}
              </td>
              <td className="text-doorli-muted">{o.customer?.fullName ?? '—'}</td>
              <td className="text-doorli-muted">{o.vendor?.businessName ?? '—'}</td>
              <td className="text-right tabular-nums font-semibold text-white">
                LKR {Number(o.totalAmount || 0).toFixed(0)}
              </td>
              <td>
                <Badge tone={statusTone(o.status)}>{o.status?.replace(/_/g, ' ')}</Badge>
              </td>
              <td>
                <Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge>
              </td>
              <td>
                <Badge
                  tone={
                    o.erpSyncStatus === 'synced' || o.erpOrderId
                      ? 'success'
                      : o.erpSyncStatus === 'failed'
                        ? 'danger'
                        : o.erpSyncStatus === 'pending'
                          ? 'warning'
                          : 'neutral'
                  }
                >
                  {o.erpSyncStatus || (o.erpOrderId ? 'synced' : '—')}
                </Badge>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </>
  );
}
