'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Order, OrderItem, Vendor, OrderStatus, Booking, ServiceRequest } from '@/lib/types';
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Store,
  Star,
  Calendar,
  Wrench,
  Package,
} from 'lucide-react';

type FilterTab = 'all' | OrderStatus;
type ViewTab = 'orders' | 'bookings' | 'requests';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  preparing: 'badge-info',
  ready: 'badge-info',
  picked_up: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-error',
  accepted: 'badge-info',
  on_the_way: 'badge-info',
  in_progress: 'badge-info',
  completed: 'badge-success',
  no_show: 'badge-error',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  accepted: 'Accepted',
  on_the_way: 'On the Way',
  in_progress: 'In Progress',
  completed: 'Completed',
  no_show: 'No Show',
};

interface OrderWithDetails extends Order {
  order_items?: OrderItem[];
  vendor?: Vendor;
}

interface BookingWithVendor extends Booking {
  vendor?: Vendor;
}

interface ServiceRequestWithVendor extends ServiceRequest {
  vendor?: Vendor;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [viewTab, setViewTab] = useState<ViewTab>('orders');
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [bookings, setBookings] = useState<BookingWithVendor[]>([]);
  const [requests, setRequests] = useState<ServiceRequestWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      // Load orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*), vendor:vendors(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      setOrders((orderData ?? []) as unknown as OrderWithDetails[]);

      // Load bookings
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*, vendor:vendors(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (bookingError) throw bookingError;
      setBookings((bookingData ?? []) as unknown as BookingWithVendor[]);

      // Load service requests
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('*, vendor:vendors(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;
      setRequests((requestData ?? []) as unknown as ServiceRequestWithVendor[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter((o) => o.status === activeTab);

  const tabCounts = FILTER_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] =
        tab.key === 'all'
          ? orders.length
          : orders.filter((o) => o.status === tab.key).length;
      return acc;
    },
    {} as Record<FilterTab, number>,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/explore" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Explore</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cart
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {/* View tabs */}
        <div className="flex gap-2 mb-6">
          {(
            [
              { key: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
              { key: 'bookings', label: 'Bookings', icon: Calendar, count: bookings.length },
              { key: 'requests', label: 'Service Requests', icon: Wrench, count: requests.length },
            ] as { key: ViewTab; label: string; icon: typeof ShoppingBag; count: number }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = viewTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setViewTab(tab.key);
                  setActiveTab('all');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders view */}
        {viewTab === 'orders' && (
          <>
            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="card p-12 text-center animate-fade-in">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
                <p className="mt-1 text-slate-500">
                  {activeTab !== 'all'
                    ? 'No orders match this filter.'
                    : 'You haven&apos;t placed any orders yet.'}
                </p>
                <Link href="/explore" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const expanded = expandedId === order.id;
                  const items = order.order_items ?? [];
                  return (
                    <div key={order.id} className="card overflow-hidden animate-fade-in">
                      {/* Order header */}
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              #{order.order_number ?? order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {order.vendor?.business_name ?? 'Vendor'} ·{' '}
                              {items.length} item{items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="font-semibold text-slate-900">
                              ${Number(order.total_amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-neutral'}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                          {expanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expanded && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50 animate-fade-in">
                          {/* Items */}
                          <div className="space-y-2 mb-4">
                            {items.map((item: OrderItem) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-100"
                              >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    ${Number(item.price).toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">
                                  ${(Number(item.price) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Details grid */}
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment</p>
                              <p className="mt-1 text-sm text-slate-900 capitalize">
                                {order.payment_method ?? '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment Status</p>
                              <p className="mt-1 text-sm text-slate-900 capitalize">
                                {order.payment_status ?? '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Delivery Address</p>
                              <p className="mt-1 text-sm text-slate-900 truncate">
                                {order.delivery_address ?? '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</p>
                              <p className="mt-1 text-sm text-slate-900 truncate">
                                {order.customer_notes ?? '—'}
                              </p>
                            </div>
                          </div>

                          {/* Totals */}
                          <div className="flex justify-end mb-4">
                            <div className="space-y-1 text-sm">
                              <div className="flex gap-8">
                                <span className="text-slate-500">Subtotal:</span>
                                <span className="font-medium text-slate-900">
                                  ${Number(order.subtotal ?? 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex gap-8">
                                <span className="text-slate-500">Delivery Fee:</span>
                                <span className="font-medium text-slate-900">
                                  ${Number(order.delivery_fee ?? 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex gap-8">
                                <span className="text-slate-500">Total:</span>
                                <span className="font-bold text-slate-900">
                                  ${Number(order.total_amount).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Review link for delivered orders */}
                          {order.status === 'delivered' && order.vendor_id && (
                            <div className="pt-3 border-t border-slate-200">
                              <Link
                                href={`/explore/${order.vendor_id}/review`}
                                className="btn-secondary inline-flex items-center gap-2 text-sm"
                              >
                                <Star className="w-4 h-4" />
                                Leave a Review
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Bookings view */}
        {viewTab === 'bookings' && (
          <>
            {bookings.length === 0 ? (
              <div className="card p-12 text-center animate-fade-in">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No bookings yet</h3>
                <p className="mt-1 text-slate-500">
                  Browse hotels, halls, or beauty vendors to make a booking.
                </p>
                <Link href="/explore" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Explore Vendors
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="card p-4 animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            #{booking.booking_number ?? booking.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {booking.vendor?.business_name ?? 'Vendor'} · {booking.service_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                            <span>{booking.start_time}</span>
                            {booking.duration_hours && <span>· {booking.duration_hours}h</span>}
                            <span>· {booking.party_size} guest{booking.party_size !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`badge ${STATUS_BADGE[booking.status] ?? 'badge-neutral'}`}>
                          {STATUS_LABEL[booking.status] ?? booking.status}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          ${Number(booking.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Service requests view */}
        {viewTab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="card p-12 text-center animate-fade-in">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No service requests yet</h3>
                <p className="mt-1 text-slate-500">
                  Browse service vendors to request a service.
                </p>
                <Link href="/explore" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Explore Vendors
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="card p-4 animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            #{request.request_number ?? request.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {request.vendor?.business_name ?? 'Vendor'} · {request.service_type}
                          </p>
                          {request.title && (
                            <p className="text-sm text-slate-600 mt-1">{request.title}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {request.preferred_date && (
                              <span>{new Date(request.preferred_date).toLocaleDateString()}</span>
                            )}
                            {request.preferred_time && <span>{request.preferred_time}</span>}
                            {request.urgency && (
                              <span className={`badge ${STATUS_BADGE[request.urgency] ?? 'badge-neutral'} capitalize`}>
                                {request.urgency}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`badge ${STATUS_BADGE[request.status] ?? 'badge-neutral'}`}>
                          {STATUS_LABEL[request.status] ?? request.status}
                        </span>
                        {request.estimated_cost != null && (
                          <span className="text-sm font-semibold text-slate-900">
                            Est. ${Number(request.estimated_cost).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
