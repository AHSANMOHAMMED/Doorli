'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, Review, Vendor } from '@/lib/types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Star,
  TrendingUp,
  Package,
} from 'lucide-react';

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

type DateRange = '7d' | '30d';

const CHART_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export default function AnalyticsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      let vendorId: string | null = null;

      if (!isAdmin) {
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
        vendorId = (vendorData as Vendor).id;
        setVendor(vendorData as Vendor);
      }

      // Fetch orders
      const ordersQuery = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (vendorId) {
        ordersQuery.eq('vendor_id', vendorId);
      }

      const { data: orderData, error: orderError } = await ordersQuery;

      if (orderError) throw orderError;
      setOrders((orderData ?? []) as unknown as OrderWithItems[]);

      // Fetch reviews
      const reviewsQuery = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorId) {
        reviewsQuery.eq('vendor_id', vendorId);
      } else {
        reviewsQuery.not('vendor_id', 'is', null);
      }

      const { data: reviewData, error: reviewError } = await reviewsQuery;

      if (reviewError) throw reviewError;
      setReviews((reviewData ?? []) as unknown as Review[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Compute date range
  const days = dateRange === '7d' ? 7 : 30;
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [days]);

  // Revenue chart data (last N days)
  const revenueData = useMemo(() => {
    const data: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayKey = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at).toISOString().slice(0, 10);
        return orderDate === dayKey && o.status !== 'cancelled';
      });
      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100,
        orders: dayOrders.length,
      });
    }
    return data;
  }, [orders, days, startDate]);

  // Orders trend (cumulative)
  const ordersTrendData = useMemo(() => {
    return revenueData.map((d) => ({
      date: d.date,
      orders: d.orders,
    }));
  }, [revenueData]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      order.order_items?.forEach((item) => {
        const existing = productMap.get(item.name) ?? { name: item.name, revenue: 0, quantity: 0 };
        existing.revenue += Number(item.price) * item.quantity;
        existing.quantity += item.quantity;
        productMap.set(item.name, existing);
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));
  }, [orders]);

  // Rating distribution
  const ratingData = useMemo(() => {
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      name: `${star} Star${star !== 1 ? 's' : ''}`,
      rating: star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return dist;
  }, [reviews]);

  // Summary stats
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Platform-wide analytics' : vendor?.business_name ?? 'Your business analytics'}
          </p>
        </div>
        {/* Date range toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Total Orders"
          value={String(totalOrders)}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Order Value"
          value={totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : '—'}
          color="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">
          Revenue (Last {days} Days)
        </h2>
        {revenueData.every((d) => d.revenue === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
                formatter={(value) => [`${Number(value).toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders trend */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">
          Orders Trend (Last {days} Days)
        </h2>
        {ordersTrendData.every((d) => d.orders === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">No product sales yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {topProducts.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rating distribution */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Rating Distribution</h2>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Star className="w-10 h-10 mb-2" />
              <p className="text-sm">No reviews yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: { name?: string; count?: number }) =>
                    entry.count && entry.count > 0 ? `${entry.name}: ${entry.count}` : ''
                  }
                >
                  {ratingData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.rating >= 4
                          ? '#16a34a'
                          : entry.rating === 3
                            ? '#f59e0b'
                            : '#dc2626'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
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

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <TrendingUp className="w-10 h-10 mb-2" />
      <p className="text-sm">No data available for this period.</p>
    </div>
  );
}
