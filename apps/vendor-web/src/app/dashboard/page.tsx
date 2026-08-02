'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bed, CalendarDays, Star, MapPin, Edit, TrendingUp, Loader as Loader2 } from 'lucide-react';
import { apiFetch, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type VendorProfile = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  addressLine?: string | null;
  avgRating?: number | string;
  totalReviews?: number;
  isOpen?: boolean;
  isVerified?: boolean;
  phone?: string | null;
};

type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
};

type Booking = {
  id: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  bookingType?: string;
};

export default function HotelHallVendorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    async function loadData() {
      try {
        const vendorRes = await apiFetch<VendorProfile>('/vendors/me');
        if (vendorRes.success && vendorRes.data) {
          setVendor(vendorRes.data);

          const ordersRes = await apiFetch<{ items: Order[] }>('/orders/vendor/mine');
          setOrders(ordersRes.data?.items ?? []);

          const bookingsRes = await apiFetch<Booking[]>(`/bookings/vendor/${vendorRes.data.id}`);
          setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        } else {
          setError(vendorRes.error || 'No vendor profile found. Complete onboarding first.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-md text-center">
          <p>{error}</p>
          <Link href="/dashboard/settings" className="mt-4 inline-block text-sm text-primary hover:underline">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    + bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  const totalBookings = bookings.length;
  const totalOrders = orders.length;

  const statsCards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: Bed,
      color: 'bg-blue-500/20 text-blue-300'
    },
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: CalendarDays,
      color: 'bg-purple-500/20 text-purple-300'
    },
    {
      title: 'Total Revenue',
      value: `${totalRevenue.toLocaleString()} LKR`,
      icon: TrendingUp,
      color: 'bg-green-500/20 text-green-300'
    },
    {
      title: 'Rating',
      value: vendor?.avgRating ? Number(vendor.avgRating).toFixed(1) : 'New',
      icon: Star,
      color: 'bg-amber-500/20 text-amber-300'
    }
  ];

  const renderProfileCard = () => {
    if (!vendor) return null;
    const isHotel = vendor.category === 'hotel';
    const isHall = vendor.category === 'hall';

    return (
      <div className="bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden hover:border-primary/50 transition-all animate-slide-up">
        <div className="relative h-40 bg-surface-variant">
          <div className="flex items-center justify-center h-full">
            <span className="material-symbols-outlined text-surface-variant text-5xl">
              {isHotel ? 'hotel' : isHall ? 'calendar_today' : 'store'}
            </span>
          </div>
          {vendor.isOpen === false && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-danger/20 text-danger text-xs rounded-full">Closed</span>
            </div>
          )}
          {vendor.isVerified && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Verified</span>
            </div>
          )}
        </div>
        <div className="p-md">
          <h3 className="font-display text-lg font-bold text-white mb-2">
            {vendor.businessName}
          </h3>
          <div className="space-y-xs mb-md">
            {(vendor.city || vendor.addressLine) && (
              <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                <MapPin className="w-4 h-4" />
                <span>{vendor.city || vendor.addressLine}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
              <Star className="w-4 h-4 text-[#fac775]" />
              <span>{vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : 'New'} {vendor.totalReviews ? `(${vendor.totalReviews} reviews)` : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
              <span className="capitalize">{vendor.category}</span>
            </div>
          </div>
          <div className="bg-surface-variant rounded-lg p-sm mb-md">
            <div className="text-xs text-[#9bb4d0] mb-1">Total Revenue</div>
            <div className="text-lg font-bold text-[#5dcaa5]">Rs. {totalRevenue.toLocaleString()}</div>
          </div>
          <div className="flex gap-xs">
            <Link
              href="/dashboard/settings"
              className="flex-1 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-center"
            >
              <Edit className="w-4 h-4 inline mr-1" />
              Edit
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderRecentOrders = () => (
    <div className="space-y-md">
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-screen-title text-screen-title text-on-surface">Recent Orders</h2>
        <Link
          href="/dashboard/orders"
          className="px-4 py-2 rounded-xl bg-primary-container text-white font-label-medium hover:brightness-110 transition-all"
        >
          View All Orders
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-8 text-center text-[#9bb4d0]">
          No orders yet. Orders will appear here in real time.
        </div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="bg-surface-container-high rounded-xl border border-surface-variant p-4 flex justify-between items-center">
              <div>
                <span className="font-mono text-xs font-semibold text-white">#{order.id.slice(0, 8)}</span>
                <span className="ml-3 text-sm text-[#9bb4d0] capitalize">{order.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#5dcaa5]">Rs. {Number(order.totalAmount).toLocaleString()}</div>
                <div className="text-xs text-[#9bb4d0]">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecentBookings = () => (
    <div className="space-y-md">
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-screen-title text-screen-title text-on-surface">Recent Bookings</h2>
        <Link
          href="/dashboard/bookings"
          className="px-4 py-2 rounded-xl bg-primary-container text-white font-label-medium hover:brightness-110 transition-all"
        >
          View All Bookings
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-8 text-center text-[#9bb4d0]">
          No bookings yet. Bookings will appear here in real time.
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="bg-surface-container-high rounded-xl border border-surface-variant p-4 flex justify-between items-center">
              <div>
                <span className="font-mono text-xs font-semibold text-white">#{booking.id.slice(0, 8)}</span>
                <span className="ml-3 text-sm text-[#9bb4d0] capitalize">{booking.status.replace(/_/g, ' ')}</span>
                {booking.bookingType && (
                  <span className="ml-2 text-xs text-[#9bb4d0]">({booking.bookingType.replace(/_/g, ' ')})</span>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-[#fac775]">Rs. {Number(booking.totalAmount).toLocaleString()}</div>
                <div className="text-xs text-[#9bb4d0]">{new Date(booking.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Vendor Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary">business</span>
            <span className="text-caption font-caption text-on-surface-variant">Live ERP Connected</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
          {statsCards.map((card, index) => (
            <div key={card.title} className="bg-surface-container-high rounded-xl p-md border border-surface-variant hover:border-primary/30 transition-all animate-slide-up" style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="text-label-medium text-on-surface">{card.title}</div>
              </div>
              <div className="font-display text-2xl font-bold text-white">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Profile */}
        {renderProfileCard()}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mt-lg">
          {renderRecentOrders()}
          {renderRecentBookings()}
        </div>
      </main>
    </div>
  );
}
