'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Vendor, BookingType, VendorCategory } from '@/lib/types';
import { Loader as Loader2, ArrowLeft, Calendar, CircleCheck as CheckCircle2, Store, Clock, Users, DollarSign } from 'lucide-react';

const FLAT_RATE: Record<VendorCategory, number> = {
  hotel: 100,
  hall: 200,
  beauty: 50,
  restaurant: 30,
  grocery: 0,
  service: 0,
};

const BOOKING_TYPE_BY_CATEGORY: Record<string, BookingType> = {
  hotel: 'hotel_room',
  hall: 'hall_booking',
  beauty: 'beauty_appointment',
  restaurant: 'restaurant_table',
};

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Single', 'Double', 'Family'];

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [bookingType, setBookingType] = useState<BookingType>('hotel_room');
  const [serviceName, setServiceName] = useState('');
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [partySize, setPartySize] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    async function loadVendor() {
      try {
        const { data, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Vendor not found.');
          setLoading(false);
          return;
        }
        const v = data as Vendor;
        setVendor(v);
        const bt = BOOKING_TYPE_BY_CATEGORY[v.category] ?? 'hotel_room';
        setBookingType(bt);
        // Default service name based on category
        setServiceName(
          v.category === 'hotel'
            ? 'Room Booking'
            : v.category === 'hall'
              ? 'Hall Reservation'
              : v.category === 'beauty'
                ? 'Salon Appointment'
                : 'Booking',
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load vendor';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  // Pre-fill contact info from profile
  useEffect(() => {
    if (profile) {
      setContactName(profile.full_name ?? '');
      setContactPhone(profile.phone ?? '');
    }
  }, [profile]);

  // Calculate total amount
  const totalAmount = (() => {
    const base = vendor ? FLAT_RATE[vendor.category] : 0;
    if (bookingType === 'hall_booking' || bookingType === 'hotel_room') {
      return base * Math.max(durationHours, 1);
    }
    return base;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Generate booking number
      const bookingNumber = `BK-${Date.now().toString().slice(-8)}`;

      const insertData: Record<string, unknown> = {
        booking_number: bookingNumber,
        user_id: user.id,
        vendor_id: vendorId,
        booking_type: bookingType,
        service_name: serviceName || `${vendor?.category} booking`,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime || null,
        duration_hours: durationHours || null,
        party_size: partySize,
        room_type: bookingType === 'hotel_room' ? roomType : null,
        special_requests: specialRequests || null,
        contact_name: contactName,
        contact_phone: contactPhone,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('bookings')
        .insert(insertData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create booking';
      setError(msg);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 text-center max-w-md animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Booking Confirmed!</h2>
          <p className="mt-2 text-slate-500">
            Your booking request has been submitted. Redirecting to your orders...
          </p>
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 text-center max-w-md">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">{error}</h2>
          <Link href="/explore" className="btn-primary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/explore/${vendorId}`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to {vendor.business_name}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Book with {vendor.business_name}</h1>
          </div>
          <p className="text-slate-500">
            Fill out the form below to request a booking. The vendor will confirm your reservation.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-5 animate-fade-in">
          {/* Booking type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Booking Type</label>
            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as BookingType)}
              className="input"
              required
            >
              <option value="hotel_room">Hotel Room</option>
              <option value="hall_booking">Hall Booking</option>
              <option value="beauty_appointment">Beauty Appointment</option>
              <option value="restaurant_table">Restaurant Table</option>
            </select>
          </div>

          {/* Service name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Deluxe Room, Hall Reservation, Haircut & Style"
              className="input"
              required
            />
          </div>

          {/* Room type (only for hotel) */}
          {bookingType === 'hotel_room' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="input"
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Booking Date</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input"
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time (optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Duration & party size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration (hours)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Party Size
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="input"
                required
              />
            </div>
          </div>

          {/* Special requests */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Special Requests (optional)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              placeholder="Any special requirements or notes..."
              className="input"
            />
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="input"
                required
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                <DollarSign className="w-4 h-4" />
                Estimated Total
              </span>
              <span className="text-2xl font-bold text-slate-900">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Final amount will be confirmed by the vendor.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Request Booking'}
            </button>
            <Link
              href={`/explore/${vendorId}`}
              className="btn-secondary inline-flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
