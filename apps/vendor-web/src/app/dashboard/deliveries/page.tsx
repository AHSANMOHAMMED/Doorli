'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Delivery, Order, Profile } from '@/lib/types';
import {
  Truck,
  Package,
  MapPin,
  Check,
  Loader2,
  KeyRound,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

interface DeliveryWithOrder extends Delivery {
  orders?: Pick<
    Order,
    'id' | 'total_amount' | 'delivery_address' | 'payment_method' | 'payment_status' | 'customer_notes'
  > & {
    order_number?: string;
    vendor?: { business_name: string };
    profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
  };
}

type FilterTab = 'all' | DeliveryStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  assigned: 'badge-info',
  picked_up: 'badge-info',
  in_transit: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-error',
  pending: 'badge-warning',
};

const STATUS_LABEL: Record<string, string> = {
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending',
};

export default function DeliveriesPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [deliveries, setDeliveries] = useState<DeliveryWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isDriver = profile?.role === 'driver';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadDeliveries() {
    setLoading(true);
    setError('');

    try {
      const selectColumns =
        '*, orders!deliveries_order_id_fkey(*, vendor:vendors!orders_vendor_id_fkey(business_name), profiles!orders_user_id_fkey(full_name, phone))';

      const deliveriesQuery = supabase
        .from('deliveries')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (isDriver) {
        deliveriesQuery.eq('driver_id', profile!.id);
      }

      const { data, error: deliveryError } = await deliveriesQuery;

      if (deliveryError) throw deliveryError;
      setDeliveries((data ?? []) as unknown as DeliveryWithOrder[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load deliveries';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
    setUpdatingId(deliveryId);
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      }
      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId);

      if (updateError) throw updateError;

      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status } : d)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update delivery';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredDeliveries =
    activeTab === 'all'
      ? deliveries
      : deliveries.filter((d) => d.status === activeTab);

  const tabCounts = FILTER_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] =
        tab.key === 'all'
          ? deliveries.length
          : deliveries.filter((d) => d.status === tab.key).length;
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

  if (!isDriver && !isAdmin) {
    return (
      <div className="card p-12 text-center">
        <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">
          This page is only available to drivers and admins.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Deliveries</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin
            ? 'All platform deliveries'
            : isDriver
              ? 'Your assigned deliveries'
              : 'Manage deliveries'}
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

      {/* Deliveries list */}
      {filteredDeliveries.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No deliveries found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => {
            const expanded = expandedId === delivery.id;
            const order = delivery.orders;
            return (
              <div key={delivery.id} className="card overflow-hidden">
                {/* Summary row */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(expanded ? null : delivery.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {order?.order_number
                            ? `#${order.order_number}`
                            : `Order ${order?.id?.slice(0, 8) ?? '—'}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {order?.vendor?.business_name ?? 'Vendor'} ·{' '}
                          {order?.profiles?.full_name ?? 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${STATUS_BADGE[delivery.status] ?? 'badge-neutral'}`}>
                        {STATUS_LABEL[delivery.status] ?? delivery.status}
                      </span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4">
                    {/* Order details */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailField
                        label="Order Total"
                        value={order ? `$${Number(order.total_amount).toFixed(2)}` : '—'}
                      />
                      <DetailField
                        label="Payment Method"
                        value={order?.payment_method ?? '—'}
                      />
                      <DetailField
                        label="Payment Status"
                        value={order?.payment_status ?? '—'}
                      />
                      <DetailField
                        label="Customer Phone"
                        value={order?.profiles?.phone ?? '—'}
                      />
                      <DetailField
                        label="Assigned At"
                        value={
                          delivery.assigned_at
                            ? new Date(delivery.assigned_at).toLocaleString()
                            : '—'
                        }
                      />
                      <DetailField
                        label="Delivered At"
                        value={
                          delivery.delivered_at
                            ? new Date(delivery.delivered_at).toLocaleString()
                            : '—'
                        }
                      />
                    </div>

                    {/* Delivery address */}
                    {order?.delivery_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Delivery Address
                          </p>
                          <p className="mt-1 text-sm text-slate-900">
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order notes */}
                    {order?.customer_notes && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Order Notes
                        </p>
                        <p className="mt-1 text-sm text-slate-900">{order.customer_notes}</p>
                      </div>
                    )}

                    {/* OTP */}
                    {delivery.otp && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <KeyRound className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                            Delivery OTP
                          </p>
                          <p className="text-lg font-bold text-amber-900 tracking-widest">
                            {delivery.otp}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Coordinates */}
                    {(delivery.pickup_lat != null || delivery.dropoff_lat != null) && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {delivery.pickup_lat != null && (
                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Pickup
                              </p>
                              <p className="mt-1 text-sm text-slate-900">
                                {Number(delivery.pickup_lat).toFixed(4)},{' '}
                                {Number(delivery.pickup_lng).toFixed(4)}
                              </p>
                            </div>
                          </div>
                        )}
                        {delivery.dropoff_lat != null && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Dropoff
                              </p>
                              <p className="mt-1 text-sm text-slate-900">
                                {Number(delivery.dropoff_lat).toFixed(4)},{' '}
                                {Number(delivery.dropoff_lng).toFixed(4)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    {isDriver && delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                        {(delivery.status === 'assigned' || delivery.status === 'pending') && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                            disabled={updatingId === delivery.id}
                            className="btn-primary inline-flex items-center gap-2 text-sm"
                          >
                            {updatingId === delivery.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                            Mark Picked Up
                          </button>
                        )}
                        {delivery.status === 'picked_up' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            disabled={updatingId === delivery.id}
                            className="btn-primary inline-flex items-center gap-2 text-sm"
                          >
                            {updatingId === delivery.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Truck className="w-4 h-4" />
                            )}
                            Start Transit
                          </button>
                        )}
                        {delivery.status === 'in_transit' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                            disabled={updatingId === delivery.id}
                            className="btn-primary inline-flex items-center gap-2 text-sm"
                          >
                            {updatingId === delivery.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
