'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Booking, BookingStatus, BookingType, Vendor, Profile } from '@/lib/types';
import {
  CalendarDays,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BookingWithCustomer extends Booking {
  total_amount: number;
  profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
}

type FilterTab = 'all' | BookingStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
  no_show: 'badge-error',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const BOOKING_TYPE_LABEL: Record<BookingType, string> = {
  hotel_room: 'Hotel Room',
  hall_booking: 'Hall Booking',
  beauty_appointment: 'Beauty Appointment',
  restaurant_table: 'Restaurant Table',
};

export default function BookingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [bookings, setBookings] = useState<BookingWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadBookings() {
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

      const selectColumns =
        '*, profiles!bookings_user_id_fkey(full_name, phone)';

      const bookingsQuery = supabase
        .from('bookings')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (vendorId) {
        bookingsQuery.eq('vendor_id', vendorId);
      }

      const { data, error: bookingError } = await bookingsQuery;

      if (bookingError) throw bookingError;
      setBookings((data ?? []) as unknown as BookingWithCustomer[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    setUpdatingId(bookingId);
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      }
      if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (updateError) throw updateError;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update booking';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredBookings =
    activeTab === 'all'
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const tabCounts = FILTER_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] =
        tab.key === 'all'
          ? bookings.length
          : bookings.filter((b) => b.status === tab.key).length;
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
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? 'All platform bookings' : vendor?.business_name ?? 'Manage your bookings'}
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

      {/* Bookings table */}
      {filteredBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No bookings found for this filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Service</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Type</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Date</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Time</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Party Size</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Amount</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const expanded = expandedId === booking.id;
                  return (
                    <>
                      <tr
                        key={booking.id}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : booking.id)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {booking.service_name}
                          {booking.booking_number && (
                            <span className="block text-xs text-slate-400">
                              #{booking.booking_number}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {BOOKING_TYPE_LABEL[booking.booking_type] ?? booking.booking_type}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {booking.booking_date
                            ? new Date(booking.booking_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {booking.start_time
                            ? String(booking.start_time).slice(0, 5)
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {booking.party_size}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          ${Number(booking.total_amount ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${STATUS_BADGE[booking.status]}`}>
                            {STATUS_LABEL[booking.status]}
                          </span>
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
                        <tr key={`${booking.id}-detail`} className="bg-slate-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Booking details */}
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <DetailField
                                  label="Customer"
                                  value={booking.profiles?.full_name ?? booking.contact_name ?? 'Customer'}
                                />
                                <DetailField
                                  label="Contact Phone"
                                  value={booking.contact_phone ?? '—'}
                                />
                                <DetailField
                                  label="Payment Status"
                                  value={booking.payment_status ?? '—'}
                                />
                                <DetailField
                                  label="Special Requests"
                                  value={booking.special_requests ?? '—'}
                                />
                              </div>

                              {/* Action buttons */}
                              {!isAdmin && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                  {booking.status === 'pending' && (
                                    <button
                                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                      disabled={updatingId === booking.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === booking.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Confirm
                                    </button>
                                  )}
                                  {booking.status === 'confirmed' && (
                                    <button
                                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                                      disabled={updatingId === booking.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === booking.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Mark Completed
                                    </button>
                                  )}
                                  {booking.status !== 'cancelled' &&
                                    booking.status !== 'completed' && (
                                      <button
                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                        disabled={updatingId === booking.id}
                                        className="btn-secondary inline-flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                        Cancel Booking
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
