'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Order, Vendor, Profile } from '@/lib/types';
import type { OrderStatus } from '@/lib/types';
import {
  ShoppingBag,
  Clock,
  DollarSign,
  Star,
  Package,
  Settings,
  TrendingUp,
  Plus,
} from 'lucide-react';

interface OrderWithCustomer extends Order {
  profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  preparing: 'badge-info',
  ready: 'badge-info',
  picked_up: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-error',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [allOrders, setAllOrders] = useState<OrderWithCustomer[]>([]);
  const [adminVendors, setAdminVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';
  const isVendor = profile?.role === 'vendor';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      if (isVendor) {
        // Find the vendor record for this user
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', profile!.id)
          .maybeSingle();

        if (vendorError) throw vendorError;
        if (!vendorData) {
          setError('No vendor profile found. Please complete onboarding first.');
          setLoading(false);
          return;
        }

        const v = vendorData as Vendor;
        setVendor(v);

        // Fetch this vendor's orders with customer profile join
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(
            '*, order_items(*), profiles!orders_user_id_fkey(full_name, phone)',
          )
          .eq('vendor_id', v.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (orderError) throw orderError;
        setOrders((orderData ?? []) as unknown as OrderWithCustomer[]);

        // Fetch all orders for stats
        const { data: allOrderData, error: allOrderError } = await supabase
          .from('orders')
          .select('*')
          .eq('vendor_id', v.id)
          .order('created_at', { ascending: false });

        if (allOrderError) throw allOrderError;
        setAllOrders((allOrderData ?? []) as unknown as OrderWithCustomer[]);
      } else if (isAdmin) {
        // Admin: platform-wide stats
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: false });

        if (vendorError) throw vendorError;
        setAdminVendors((vendorData ?? []) as Vendor[]);

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(
            '*, order_items(*), profiles!orders_user_id_fkey(full_name, phone)',
          )
          .order('created_at', { ascending: false })
          .limit(5);

        if (orderError) throw orderError;
        setOrders((orderData ?? []) as unknown as OrderWithCustomer[]);

        const { data: allOrderData, error: allOrderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (allOrderError) throw allOrderError;
        setAllOrders((allOrderData ?? []) as unknown as OrderWithCustomer[]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Compute stats
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing',
  ).length;
  const totalRevenue = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const avgRating = vendor ? vendor.avg_rating : 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? 'Platform Overview' : vendor?.business_name ?? 'Dashboard'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin
            ? 'Manage all vendors, orders, and platform activity'
            : vendor
              ? `${vendor.category} · ${vendor.is_open ? 'Open now' : 'Closed'} · ${vendor.is_verified ? 'Verified' : 'Pending verification'}`
              : 'Welcome to your vendor dashboard'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Total Orders"
          value={String(totalOrders)}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Orders"
          value={String(pendingOrders)}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Admin extra stats */}
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Vendors"
            value={String(adminVendors.length)}
            color="bg-sky-50 text-sky-600"
          />
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="Verified Vendors"
            value={String(adminVendors.filter((v) => v.is_verified).length)}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Open Now"
            value={String(adminVendors.filter((v) => v.is_open).length)}
            color="bg-blue-50 text-blue-600"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/orders" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>
          <Link href="/dashboard/products" className="btn-secondary inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            Manage Products
          </Link>
          {isVendor && (
            <Link href="/dashboard/products" className="btn-secondary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
          <Link href="/dashboard/settings" className="btn-secondary inline-flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No orders yet. They will appear here when customers place orders.
          </div>
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
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      #{order.order_number ?? order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.profiles?.full_name ?? 'Customer'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.order_items?.length ?? 0} items
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
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
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
