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
} from 'lucide-react';
import { apiFetch, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
    return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">{error}</div>
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
  const recent = orders.slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{vendor?.businessName ?? 'Dashboard'}</h1>
        <p className="text-slate-500 mt-1">
          {vendor
            ? `${vendor.category} · ${vendor.isOpen ? 'Open now' : 'Closed'} · ${vendor.isVerified ? 'Verified' : 'Pending verification'}`
            : 'Welcome to your vendor dashboard'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Total Orders" value={String(totalOrders)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Orders" value={String(pendingOrders)} color="bg-amber-50 text-amber-600" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`LKR ${totalRevenue.toFixed(0)}`} color="bg-green-50 text-green-600" />
        <StatCard icon={<Star className="w-5 h-5" />} label="Avg Rating" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="card p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/orders" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> View Orders
          </Link>
          <Link href="/dashboard/products" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 inline-flex items-center gap-2">
            <Package className="w-4 h-4" /> Manage Products
          </Link>
          <Link href="/dashboard/products" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link href="/dashboard/settings" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 inline-flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden border rounded-lg shadow-sm bg-white mt-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Order</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Customer</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Items</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Total</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">#{order.orderNumber ?? order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customer?.fullName ?? 'Customer'}</td>
                    <td className="px-6 py-4 text-slate-600">{order.items?.length ?? 0} items</td>
                    <td className="px-6 py-4 font-medium">LKR {Number(order.totalAmount).toFixed(0)}</td>
                    <td className="px-6 py-4 capitalize">{order.status.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-5 border rounded-lg shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
