'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp as TrendingUpRaw, TrendingDown as TrendingDownRaw, DollarSign as DollarSignRaw, ShoppingCart as ShoppingCartRaw, Users as UsersRaw, Store as StoreRaw,
  BarChart3 as BarChart3Raw, PieChart as PieChartRaw, Activity as ActivityRaw, RefreshCw
} from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, Panel, StatCard, Skeleton } from '@/components/ui';

type AnalyticsData = {
  revenue: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  orders: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    activeToday: number;
  };
  vendors: {
    total: number;
    active: number;
    pendingVerification: number;
    topPerformers: Array<{ id: string; name: string; revenue: number; orders: number }>;
  };
  drivers: {
    total: number;
    online: number;
    deliveriesToday: number;
    avgDeliveryTime: number;
  };
  categories: Array<{ name: string; revenue: number; percentage: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string; amount?: number }>;
};

type SafeIconProps = { className?: string; size?: number };
const TrendingUp = TrendingUpRaw as unknown as React.ComponentType<SafeIconProps>;
const TrendingDown = TrendingDownRaw as unknown as React.ComponentType<SafeIconProps>;
const DollarSign = DollarSignRaw as unknown as React.ComponentType<SafeIconProps>;
const ShoppingCart = ShoppingCartRaw as unknown as React.ComponentType<SafeIconProps>;
const Users = UsersRaw as unknown as React.ComponentType<SafeIconProps>;
const Store = StoreRaw as unknown as React.ComponentType<SafeIconProps>;
const SafeBarChart3 = BarChart3Raw as unknown as React.ComponentType<SafeIconProps>;
const PieChart = PieChartRaw as unknown as React.ComponentType<SafeIconProps>;
const Activity = ActivityRaw as unknown as React.ComponentType<SafeIconProps>;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<AnalyticsData>('/admin/analytics'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAnalytics(); }, []);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-[#5dcaa5]';
    if (growth < 0) return 'text-[#f2668b]';
    return 'text-[#7b8ba3]';
  };

  const getGrowthIcon = (growth: number) => {
    const Icon = (growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Activity) as unknown as React.ComponentType<{ className?: string }>;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Platform performance metrics and insights" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Platform performance metrics and insights" />
          <div className="text-center py-12">
           <SafeBarChart3 className="w-12 h-12 text-[#5a6a80] mx-auto mb-4" />
           <p className="text-[#7b8ba3]">{error || 'No analytics data available yet'}</p>
           <button type="button" onClick={() => void loadAnalytics()} className="btn btn-ghost mt-4"><RefreshCw size={15} /> Retry</button>
        </div>
      </>
    );
  }

  const revenueGrowth = calculateGrowth(data.revenue.thisMonth, data.revenue.lastMonth);
  const ordersGrowth = calculateGrowth(data.orders.thisMonth, data.orders.lastMonth);
  const rangeValues = {
    today: { revenue: data.revenue.today, orders: data.orders.today, users: data.users.newToday, label: 'today' },
    week: { revenue: data.revenue.thisWeek, orders: data.orders.thisWeek, users: data.users.newThisWeek, label: 'this week' },
    month: { revenue: data.revenue.thisMonth, orders: data.orders.thisMonth, users: data.users.newThisMonth, label: 'this month' },
  }[timeRange];

  return (
    <>
      <PageHeader 
        title="Analytics" 
        subtitle="Platform performance metrics and insights"
        actions={
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-[#5dcaa5] text-[#0a0f2e]'
                    : 'bg-white/5 text-[#7b8ba3] hover:bg-white/10'
                }`}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          label="Revenue" 
           value={`LKR ${rangeValues.revenue.toLocaleString()}`}
           hint={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs last month · ${rangeValues.label}`}
          tone="teal" 
          icon={<DollarSign size={17} />} 
        />
        <StatCard 
          label="Orders" 
           value={rangeValues.orders}
           hint={`${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth.toFixed(1)}% vs last month · ${rangeValues.label}`}
          tone="blue" 
          icon={<ShoppingCart size={17} />} 
        />
        <StatCard 
          label="New Users" 
           value={rangeValues.users}
           hint={`${data.users.activeToday} active today · ${rangeValues.label}`}
          tone="gold" 
          icon={<Users size={17} />} 
        />
        <StatCard 
          label="Active Drivers" 
          value={data.drivers.online} 
          hint={`${data.drivers.deliveriesToday} deliveries today`}
          tone="rose" 
          icon={<Store size={17} />} 
        />
      </div>

      {/* Revenue & Orders Trend */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Revenue Trend" icon={<TrendingUp size={17} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">LKR {data.revenue.today.toLocaleString()}</p>
                <p className="text-sm text-[#7b8ba3]">Today</p>
              </div>
              <div className={`flex items-center gap-1 ${getGrowthColor(calculateGrowth(data.revenue.today, data.revenue.yesterday))}`}>
                {getGrowthIcon(calculateGrowth(data.revenue.today, data.revenue.yesterday))}
                <span className="text-sm font-medium">
                  {calculateGrowth(data.revenue.today, data.revenue.yesterday).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-lg font-semibold text-white">LKR {data.revenue.thisWeek.toLocaleString()}</p>
                <p className="text-xs text-[#7b8ba3]">This Week</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-lg font-semibold text-white">LKR {data.revenue.lastWeek.toLocaleString()}</p>
                <p className="text-xs text-[#7b8ba3]">Last Week</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Orders Trend" icon={<ShoppingCart size={17} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{data.orders.today}</p>
                <p className="text-sm text-[#7b8ba3]">Today</p>
              </div>
              <div className={`flex items-center gap-1 ${getGrowthColor(calculateGrowth(data.orders.today, data.orders.yesterday))}`}>
                {getGrowthIcon(calculateGrowth(data.orders.today, data.orders.yesterday))}
                <span className="text-sm font-medium">
                  {calculateGrowth(data.orders.today, data.orders.yesterday).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-lg font-semibold text-white">{data.orders.thisWeek}</p>
                <p className="text-xs text-[#7b8ba3]">This Week</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-lg font-semibold text-white">{data.orders.lastWeek}</p>
                <p className="text-xs text-[#7b8ba3]">Last Week</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Category Performance & Top Vendors */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Revenue by Category" icon={<PieChart size={17} />}>
          <div className="space-y-3">
            {data.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ 
                    backgroundColor: ['#5dcaa5', '#fac775', '#378add', '#f2668b', '#9b59b6'][index % 5] 
                  }} />
                  <span className="text-sm text-white">{category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#7b8ba3]">{category.percentage.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-white">LKR {category.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Vendors" icon={<Store size={17} />}>
          <div className="space-y-3">
            {data.vendors.topPerformers.slice(0, 5).map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#5dcaa5]">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{vendor.name}</p>
                    <p className="text-xs text-[#7b8ba3]">{vendor.orders} orders</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-white">LKR {vendor.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Driver Performance */}
      <Panel title="Driver Performance" icon={<Activity size={17} />}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{data.drivers.total}</p>
            <p className="text-sm text-[#7b8ba3]">Total Drivers</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-2xl font-bold text-[#5dcaa5]">{data.drivers.online}</p>
            <p className="text-sm text-[#7b8ba3]">Online Now</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{data.drivers.deliveriesToday}</p>
            <p className="text-sm text-[#7b8ba3]">Deliveries Today</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <p className="text-2xl font-bold text-[#fac775]">{data.drivers.avgDeliveryTime} min</p>
            <p className="text-sm text-[#7b8ba3]">Avg Delivery Time</p>
          </div>
        </div>
      </Panel>

      {/* Recent Activity */}
      <Panel title="Recent Activity" icon={<Activity size={17} />}>
        <div className="space-y-3">
          {data.recentActivity.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'order' ? 'bg-[#5dcaa5]' :
                  activity.type === 'user' ? 'bg-[#378add]' :
                  activity.type === 'vendor' ? 'bg-[#fac775]' :
                  'bg-[#f2668b]'
                }`} />
                <div>
                  <p className="text-sm text-white">{activity.description}</p>
                  <p className="text-xs text-[#7b8ba3]">{activity.timestamp}</p>
                </div>
              </div>
              {activity.amount && (
                <span className="text-sm font-medium text-white">
                  LKR {activity.amount.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
