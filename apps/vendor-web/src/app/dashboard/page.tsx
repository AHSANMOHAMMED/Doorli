import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@doorli/db';
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
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to determine role
  const profile = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!profile) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">
        No profile found for this user in PostgreSQL.
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const isVendor = profile.role === 'vendor';

  let vendor = null;
  let orders = [];
  let allOrders = [];
  let adminVendors = [];

  if (isVendor) {
    vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });

    if (!vendor) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">
          No vendor profile found. Please complete onboarding first.
        </div>
      );
    }

    orders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { fullName: true, phone: true } },
        items: true,
      }
    });

    allOrders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    });

  } else if (isAdmin) {
    adminVendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' }
    });

    orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { fullName: true, phone: true } },
        items: true,
      }
    });

    allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } else {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 m-8">
        Access Denied: You are neither a vendor nor an admin.
      </div>
    );
  }

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing',
  ).length;
  const totalRevenue = allOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const avgRating = vendor ? Number(vendor.avgRating) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? 'Platform Overview' : vendor?.businessName ?? 'Dashboard'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin
            ? 'Manage all vendors, orders, and platform activity'
            : vendor
              ? `${vendor.category} · ${vendor.isOpen ? 'Open now' : 'Closed'} · ${vendor.isVerified ? 'Verified' : 'Pending verification'}`
              : 'Welcome to your vendor dashboard'}
        </p>
      </div>

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
            value={String(adminVendors.filter((v) => v.isVerified).length)}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Open Now"
            value={String(adminVendors.filter((v) => v.isOpen).length)}
            color="bg-blue-50 text-blue-600"
          />
        </div>
      )}

      <div className="card p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/orders" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>
          <Link href="/dashboard/products" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            Manage Products
          </Link>
          {isVendor && (
            <Link href="/dashboard/products/new" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
          <Link href="/dashboard/settings" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden border rounded-lg shadow-sm bg-white mt-8">
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
                      #{order.orderNumber ?? order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.customer?.fullName ?? 'Customer'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.items?.length ?? 0} items
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
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
    <div className="p-5 border rounded-lg shadow-sm bg-white">
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
