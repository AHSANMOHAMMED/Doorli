'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { CalendarDays, Check, X, Loader as Loader2 } from 'lucide-react';

type Booking = {
  id: string;
  bookingNumber: string;
  bookingType: string;
  status: string;
  totalAmount: number | string;
  depositAmount?: number | string | null;
  eventDate?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  guestCount?: number | null;
  requirements?: string | null;
  createdAt: string;
  customer?: { fullName?: string; phone?: string };
};

type FilterTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    void load();
  }, [authLoading, profile]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const vendorRes = await apiFetch<{ id: string }>('/vendors/me');
      if (!vendorRes.success || !vendorRes.data) {
        setError(vendorRes.error || 'No vendor profile found. Complete onboarding first.');
        setLoading(false);
        return;
      }
      setVendorId(vendorRes.data.id);
      const res = await apiFetch<Booking[]>(`/bookings/vendor/${vendorRes.data.id}`);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      const res = await apiFetch(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.success) throw new Error(res.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered =
    activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading bookings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6" /> Bookings
        </h1>
        <p className="text-slate-500 mt-1">Hotel, hall, and appointment bookings for your business</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border rounded-lg bg-white">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    #{b.bookingNumber} · {b.bookingType}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {b.customer?.fullName ?? 'Customer'}
                    {b.customer?.phone ? ` · ${b.customer.phone}` : ''}
                  </div>
                  <div className="text-sm text-slate-600 mt-2">
                    {b.checkInDate
                      ? `${new Date(b.checkInDate).toLocaleDateString()} → ${
                          b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '—'
                        }`
                      : b.eventDate
                        ? new Date(b.eventDate).toLocaleString()
                        : new Date(b.createdAt).toLocaleString()}
                  </div>
                  {b.requirements && <p className="text-sm text-slate-500 mt-2">{b.requirements}</p>}
                </div>
                <div className="text-right">
                  <div className="font-bold">LKR {Number(b.totalAmount).toFixed(0)}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">{b.status}</div>
                  {b.status === 'pending' && (
                    <div className="flex gap-2 mt-3 justify-end">
                      <button
                        type="button"
                        disabled={updatingId === b.id}
                        onClick={() => updateStatus(b.id, 'confirmed')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                      >
                        <Check className="w-4 h-4" /> Confirm
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === b.id}
                        onClick={() => updateStatus(b.id, 'cancelled')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={updatingId === b.id}
                      onClick={() => updateStatus(b.id, 'completed')}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!vendorId && !error && (
        <p className="text-sm text-slate-400">Load a vendor profile via onboarding to manage bookings.</p>
      )}
    </div>
  );
}
