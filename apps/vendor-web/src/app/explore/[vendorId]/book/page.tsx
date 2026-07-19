'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';
import { ArrowLeft, Loader as Loader2 } from 'lucide-react';

export default function ExploreBookPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const router = useRouter();
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('hotel');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [guestCount, setGuestCount] = useState('2');
  const [totalAmount, setTotalAmount] = useState('5000');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    void (async () => {
      try {
        const res = await apiFetch<{ businessName: string; category: string }>(`/vendors/${vendorId}`);
        if (res.data) {
          setVendorName(res.data.businessName);
          setCategory(res.data.category);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const bookingType =
      category === 'hotel' || category === 'hall' || category === 'beauty' || category === 'service'
        ? category
        : 'service';
    try {
      const res = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          bookingType,
          eventDate: eventDate || undefined,
          checkInDate: bookingType === 'hotel' ? eventDate : undefined,
          startTime: eventDate ? `${eventDate}T${startTime}:00` : undefined,
          guestCount: parseInt(guestCount, 10) || 1,
          totalAmount: parseFloat(totalAmount) || 0,
          depositAmount: Math.round((parseFloat(totalAmount) || 0) * 0.2),
          requirements: requirements || undefined,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Booking failed');
      router.push('/dashboard/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 flex items-center gap-2 text-slate-500">
        <Loader2 className="animate-spin w-5 h-5" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <Link href={`/explore/${vendorId}`} className="inline-flex items-center gap-2 text-sm text-slate-600">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold">Book {vendorName}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4">
        <label className="block text-sm">
          Date
          <input
            required
            type="date"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Start time
          <input
            type="time"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Guests
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Total amount (LKR)
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Requirements
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2"
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Confirm booking'}
        </button>
      </form>
    </div>
  );
}
