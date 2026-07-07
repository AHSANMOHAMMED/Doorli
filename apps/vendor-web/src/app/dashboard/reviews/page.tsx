'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Review, Vendor, Profile } from '@/lib/types';
import { Star, MessageSquare } from 'lucide-react';

interface ReviewWithCustomer extends Review {
  profiles?: Pick<Profile, 'full_name'> | null;
}

export default function ReviewsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<ReviewWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadReviews() {
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

      const selectColumns = '*, profiles!reviews_user_id_fkey(full_name)';

      const reviewsQuery = supabase
        .from('reviews')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (vendorId) {
        reviewsQuery.eq('vendor_id', vendorId);
      } else {
        // Admin: only vendor reviews (not driver/product-only reviews)
        reviewsQuery.not('vendor_id', 'is', null);
      }

      const { data, error: reviewError } = await reviewsQuery;

      if (reviewError) throw reviewError;
      setReviews((data ?? []) as unknown as ReviewWithCustomer[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load reviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Compute rating summary
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: totalReviews > 0 ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100 : 0,
  }));

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
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? 'All platform reviews' : vendor?.business_name ?? 'Customer reviews'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Rating summary */}
      <div className="card p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Average rating */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-slate-200">
            <p className="text-5xl font-bold text-slate-900">
              {avgRating.toFixed(1)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(avgRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating distribution */}
          <div className="sm:col-span-2 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-slate-700">{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {totalReviews === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {(review.profiles?.full_name ?? 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {review.profiles?.full_name ?? 'Customer'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
