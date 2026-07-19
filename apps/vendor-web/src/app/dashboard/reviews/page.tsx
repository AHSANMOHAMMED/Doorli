'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Star, Loader as Loader2 } from 'lucide-react';

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: { fullName?: string };
};

export default function ReviewsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !profile) return;
    void load();
  }, [authLoading, profile]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const vendorRes = await apiFetch<{ id: string; avgRating?: number | string }>('/vendors/me');
      if (!vendorRes.success || !vendorRes.data) {
        setError(vendorRes.error || 'No vendor profile found');
        setLoading(false);
        return;
      }
      setAvgRating(Number(vendorRes.data.avgRating ?? 0));
      const res = await apiFetch<Review[]>(`/reviews/vendor/${vendorRes.data.id}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-6 h-6" /> Reviews
        </h1>
        <p className="text-slate-500 mt-1">
          Average rating: {avgRating > 0 ? avgRating.toFixed(1) : '—'} · {reviews.length} reviews
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

      {reviews.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border rounded-lg bg-white">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.reviewer?.fullName ?? 'Customer'}</div>
                <div className="text-amber-500 font-semibold">{'★'.repeat(r.rating)}</div>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
              <div className="text-xs text-slate-400 mt-2">
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
