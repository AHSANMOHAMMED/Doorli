'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Vendor } from '@/lib/types';
import {
  Star,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Store,
  MessageSquare,
} from 'lucide-react';

export default function ReviewPage() {
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

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

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
        setVendor(data as Vendor);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('reviews').insert({
        user_id: user.id,
        vendor_id: vendorId,
        product_id: null,
        driver_id: null,
        order_id: null,
        rating,
        comment: comment || null,
        images: null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/explore/${vendorId}`);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
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
          <h2 className="text-xl font-bold text-slate-900">Review Submitted!</h2>
          <p className="mt-2 text-slate-500">
            Thank you for your feedback. Redirecting back to the vendor page...
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

  const displayRating = hoverRating || rating;

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

      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Leave a Review</h1>
          </div>
          <p className="text-slate-500">
            Share your experience with <span className="font-medium text-slate-700">{vendor.business_name}</span>.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-6 animate-fade-in">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      i <= displayRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-slate-600">
                {displayRating} / 5
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {displayRating === 1 && 'Poor'}
              {displayRating === 2 && 'Fair'}
              {displayRating === 3 && 'Good'}
              {displayRating === 4 && 'Very Good'}
              {displayRating === 5 && 'Excellent'}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Tell others about your experience..."
              className="input"
            />
          </div>

          {/* User info */}
          {profile && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-blue-700">
                    {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {profile.full_name ?? 'Anonymous'}
                </p>
                <p className="text-xs text-slate-500">Posting as {profile.role}</p>
              </div>
            </div>
          )}

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
                <Star className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Review'}
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
