'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';
import { ArrowLeft, Loader as Loader2 } from 'lucide-react';

export default function ExploreReviewPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const router = useRouter();
  const [vendorName, setVendorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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
        const res = await apiFetch<{ businessName: string }>(`/vendors/${vendorId}`);
        setVendorName(res.data?.businessName || '');
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
    try {
      const res = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ vendorId, rating, comment: comment || undefined }),
      });
      if (!res.success) throw new Error(res.error || 'Review failed');
      router.push(`/explore/${vendorId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
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
      <h1 className="text-2xl font-bold">Review {vendorName}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4">
        <label className="block text-sm">
          Rating
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Comment
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit review'}
        </button>
      </form>
    </div>
  );
}
