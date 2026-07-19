'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';
import { ArrowLeft, Loader as Loader2 } from 'lucide-react';

export default function ExploreRequestPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const router = useRouter();
  const [vendorName, setVendorName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [offeredRate, setOfferedRate] = useState('2000');
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
      const res = await apiFetch('/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          serviceType: 'general',
          title,
          description: `${description}\nPreferred vendor: ${vendorId} (${vendorName})`,
          addressLine,
          isUrgent,
          offeredRate: parseFloat(offeredRate) || undefined,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Request failed');
      router.push('/dashboard/service-requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
      <h1 className="text-2xl font-bold">Request {vendorName}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4">
        <label className="block text-sm">
          Title
          <input
            required
            minLength={5}
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Address
          <input
            required
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Offered rate (LKR)
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={offeredRate}
            onChange={(e) => setOfferedRate(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
          Mark as urgent
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Sending...' : 'Send request'}
        </button>
      </form>
    </div>
  );
}
