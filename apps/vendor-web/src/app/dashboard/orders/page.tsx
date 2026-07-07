'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, Vendor, Profile, OrderStatus } from '@/lib/types';
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Check,
  ChefHat,
  PackageCheck,
  X,
  Loader2,
} from 'lucide-react';

interface OrderWithCustomer extends Order {
  profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
}

type FilterTab = 'all' | OrderStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

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

export default function OrdersPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      let vendorId: string | null = null;

      if (!isAdmin) {
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
        vendorId = (vendorData as Vendor).id;
        setVendor(vendorData as Vendor);
      }

      const selectColumns =
        '*, order_items(*), profiles!orders_user_id_fkey(full_name, phone)';

      const ordersQuery = supabase
        .from('orders')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (vendorId) {
        ordersQuery.eq('vendor_id', vendorId);
      }

      const { data, error: orderError } = await ordersQuery;

      if (orderError) throw orderError;
      setOrders((data ?? []) as unknown as OrderWithCustomer[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update order';
      setError(msg);
    } finally {
      setUpdatingId(null);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? 'All platform orders' : vendor?.business_name ?? 'Manage your orders'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
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

      {/* Orders table */}
      {filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Order ID</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Customer</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Items</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Total</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Date</th>
                  <th className="px-6 py-3 font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const expanded = expandedId === order.id;
                  const items = order.order_items ?? [];
                  return (
                    <>
                      <tr
                        key={order.id}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          #{order.order_number ?? order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {order.profiles?.full_name ?? 'Customer'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {items.length} item{items.length !== 1 ? 's' : ''}
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
                        <td className="px-6 py-4 text-slate-400">
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${order.id}-detail`} className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Order details */}
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <DetailField
                                  label="Payment Method"
                                  value={order.payment_method ?? '—'}
                                />
                                <DetailField
                                  label="Payment Status"
                                  value={order.payment_status ?? '—'}
                                />
                                <DetailField
                                  label="Delivery Address"
                                  value={order.delivery_address ?? '—'}
                                />
                                <DetailField
                                  label="Customer Notes"
                                  value={order.customer_notes ?? '—'}
                                />
                              </div>

                              {/* Order items */}
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                  Order Items
                                </h4>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                      <tr>
                                        <th className="px-4 py-2 font-medium text-slate-600">Item</th>
                                        <th className="px-4 py-2 font-medium text-slate-600">Price</th>
                                        <th className="px-4 py-2 font-medium text-slate-600">Qty</th>
                                        <th className="px-4 py-2 font-medium text-slate-600">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((item: OrderItem) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-slate-50 last:border-0"
                                        >
                                          <td className="px-4 py-2 text-slate-900">
                                            {item.name}
                                          </td>
                                          <td className="px-4 py-2 text-slate-600">
                                            ${Number(item.price).toFixed(2)}
                                          </td>
                                          <td className="px-4 py-2 text-slate-600">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 font-medium text-slate-900">
                                            ${(Number(item.price) * item.quantity).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Totals */}
                              <div className="flex justify-end">
                                <div className="space-y-1 text-sm">
                                  <div className="flex gap-8">
                                    <span className="text-slate-500">Subtotal:</span>
                                    <span className="font-medium text-slate-900">
                                      ${Number(order.subtotal ?? order.total_amount).toFixed(2)}
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

                              {/* Action buttons */}
                              {!isAdmin && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                  {order.status === 'pending' && (
                                    <button
                                      onClick={() => updateStatus(order.id, 'confirmed')}
                                      disabled={updatingId === order.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Confirm
                                    </button>
                                  )}
                                  {order.status === 'confirmed' && (
                                    <button
                                      onClick={() => updateStatus(order.id, 'preparing')}
                                      disabled={updatingId === order.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <ChefHat className="w-4 h-4" />
                                      )}
                                      Start Preparing
                                    </button>
                                  )}
                                  {order.status === 'preparing' && (
                                    <button
                                      onClick={() => updateStatus(order.id, 'ready')}
                                      disabled={updatingId === order.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <PackageCheck className="w-4 h-4" />
                                      )}
                                      Mark Ready
                                    </button>
                                  )}
                                  {order.status === 'ready' && (
                                    <button
                                      onClick={() => updateStatus(order.id, 'delivered')}
                                      disabled={updatingId === order.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Mark Delivered
                                    </button>
                                  )}
                                  {order.status !== 'cancelled' &&
                                    order.status !== 'delivered' && (
                                      <button
                                        onClick={() => updateStatus(order.id, 'cancelled')}
                                        disabled={updatingId === order.id}
                                        className="btn-secondary inline-flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                        Cancel Order
                                      </button>
                                    )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
