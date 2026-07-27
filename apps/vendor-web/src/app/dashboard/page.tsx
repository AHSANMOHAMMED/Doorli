'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Clock,
  DollarSign,
  Star,
  Package,
  Settings,
  Plus,
  Store,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, StatCard, Panel, Badge, EmptyState, LoadingBlock, ErrorNote } from '@/components/console';

type Order = {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  customer?: { fullName?: string };
  items?: unknown[];
};

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  isOpen: boolean;
  isVerified: boolean;
  avgRating: number | string;
};

const QUICK_ACTIONS = [
  { href: '/dashboard/pos', label: 'Open cashier', icon: Store, primary: true },
  { href: '/dashboard/orders', label: 'View orders', icon: ShoppingBag },
  { href: '/dashboard/products', label: 'Add product', icon: Plus },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function statusTone(status: string): 'success' | 'warning' | 'error' | 'info' {
  const s = status.toLowerCase();
  if (['delivered', 'completed'].includes(s)) return 'success';
  if (['cancelled', 'rejected', 'failed'].includes(s)) return 'error';
  if (['pending', 'preparing', 'confirmed'].includes(s)) return 'warning';
  return 'info';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!getToken() || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'vendor' && user.role !== 'admin') {
      setError('Vendor account required');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const ordersRes = await apiFetch<{ items: Order[] }>('/orders/vendor/mine');
        setOrders(ordersRes.data?.items ?? []);

        const vendorRes = await apiFetch<Vendor>('/vendors/me');
        if (vendorRes.success && vendorRes.data) setVendor(vendorRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <>
        <PageHeader title="Overview" subtitle="Loading your storefront…" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <LoadingBlock rows={1} />
          <LoadingBlock rows={1} />
          <LoadingBlock rows={1} />
          <LoadingBlock rows={1} />
        </div>
        <LoadingBlock rows={3} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Overview" />
        <ErrorNote>{error}</ErrorNote>
      </>
    );
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing',
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const avgRating = vendor ? Number(vendor.avgRating) : 0;
  const recent = orders.slice(0, 6);

  return (
    <>
      <PageHeader
        title={vendor?.businessName ?? 'Overview'}
        subtitle={vendor ? <span className="capitalize">{vendor.category}</span> : 'Welcome to your vendor console'}
        actions={
          vendor && (
            <>
              <Badge tone={vendor.isOpen ? 'success' : 'neutral'}>{vendor.isOpen ? 'Open now' : 'Closed'}</Badge>
              <Badge tone={vendor.isVerified ? 'info' : 'warning'}>
                {vendor.isVerified ? 'Verified' : 'Pending verification'}
              </Badge>
            </>
          )
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={totalOrders} hint="All time" tone="blue" icon={<ShoppingBag size={17} />} delay="doorli-rise" />
        <StatCard label="Needs action" value={pendingOrders} hint="Pending, confirmed or preparing" tone="gold" icon={<Clock size={17} />} delay="doorli-rise-delay" />
        <StatCard label="Revenue" value={`LKR ${totalRevenue.toFixed(0)}`} hint="Excludes cancelled orders" tone="teal" icon={<DollarSign size={17} />} delay="doorli-rise-delay-2" />
        <StatCard label="Rating" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} hint="Customer average" tone="rose" icon={<Star size={17} />} delay="doorli-rise-delay-2" />
      </div>

      <div className="flex flex-wrap gap-2.5">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, primary }) => (
          <Link
            key={label}
            href={href}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              primary
                ? 'bg-gradient-to-r from-[#185fa5] to-[#1d9e75] text-white shadow-lg shadow-[#185fa5]/25 hover:brightness-110'
                : 'border border-white/[0.1] bg-white/[0.05] text-doorli-muted hover:bg-white/[0.1] hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      <Panel
        title="Recent orders"
        icon={<ShoppingBag size={17} />}
        bodyClassName=""
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7cb6ea] transition-colors hover:text-[#a9d2f5]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Package size={20} />}
              title="No orders yet"
              desc="Once customers start ordering, the latest ones will appear here."
              action={
                <Link
                  href="/dashboard/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#1d9e75] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Add your first product
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="console-table w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs font-semibold">
                      #{order.orderNumber ?? order.id.slice(0, 8)}
                    </td>
                    <td className="text-doorli-muted">{order.customer?.fullName ?? 'Customer'}</td>
                    <td className="text-doorli-muted">{order.items?.length ?? 0}</td>
                    <td className="text-right font-semibold tabular-nums">
                      LKR {Number(order.totalAmount).toFixed(0)}
                    </td>
                    <td>
                      <Badge tone={statusTone(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-doorli-dim">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
