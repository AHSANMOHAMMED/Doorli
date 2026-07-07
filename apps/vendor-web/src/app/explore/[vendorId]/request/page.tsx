'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Vendor } from '@/lib/types';
import { Loader as Loader2, ArrowLeft, Wrench, CircleCheck as CheckCircle2, Store, MapPin, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react';

const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
type Urgency = (typeof URGENCY_LEVELS)[number];

const URGENCY_BADGE: Record<Urgency, string> = {
  low: 'badge-success',
  medium: 'badge-warning',
  high: 'badge-error',
};

export default function ServiceRequestPage() {
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

  const [serviceType, setServiceType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
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
        setServiceType(v.category === 'service' ? 'General Service' : v.category);
        setCity(v.city ?? '');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const requestNumber = `SR-${Date.now().toString().slice(-8)}`;

      const insertData: Record<string, unknown> = {
        request_number: requestNumber,
        user_id: user.id,
        vendor_id: vendorId,
        service_type: serviceType,
        title,
        description,
        address,
        city: city || null,
        preferred_date: preferredDate,
        preferred_time: preferredTime || null,
        urgency,
        status: 'pending',
        payment_status: 'pending',
        contact_name: contactName,
        contact_phone: contactPhone,
      };

      const { error: insertError } = await supabase
        .from('service_requests')
        .insert(insertData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
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
          <h2 className="text-xl font-bold text-slate-900">Request Submitted!</h2>
          <p className="mt-2 text-slate-500">
            Your service request has been sent to the vendor. Redirecting to your orders...
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
            <Wrench className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Request Service from {vendor.business_name}</h1>
          </div>
          <p className="text-slate-500">
            Describe the service you need. The vendor will review your request and provide a quote.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-5 animate-fade-in">
          {/* Service type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. Plumbing, Electrical, Cleaning, Repair"
              className="input"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your request"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the service you need in detail..."
              className="input"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Service Address
              </span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address where service is needed"
              className="input"
              required
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="input"
            />
          </div>

          {/* Preferred date & time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Preferred Date
                </span>
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Urgency Level
              </span>
            </label>
            <div className="flex gap-2">
              {URGENCY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
                    urgency === level
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <span className={`badge ${URGENCY_BADGE[urgency]} capitalize`}>
                {urgency} priority
              </span>
            </div>
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

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Request'}
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
