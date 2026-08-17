'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/api';

type Failure = {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  nextRetryAt?: string | null;
  updatedAt: string;
};

export default function IntegrationFailuresPage() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setFailures(await adminFetch<Failure[]>('/admin/integration-failures'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sync failures');
    } finally {
      setLoading(false);
    }
  }

  async function retry(id: string) {
    try {
      await adminFetch(`/admin/integration-failures/${id}/retry`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="space-y-6 p-6 lg:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ERP operations</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Sync recovery</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Durable Enterprise and embedded ERP callbacks with bounded automatic retry.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10">
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {loading ? <p className="p-6 text-sm text-slate-400">Loading sync failures...</p> : failures.length === 0 ? (
          <div className="flex items-center gap-3 p-8 text-emerald-200"><CheckCircle2 size={20} /> No pending integration failures.</div>
        ) : <div className="divide-y divide-white/10">{failures.map((failure) => <article key={failure.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={18} /><div><p className="font-semibold text-white">{failure.kind} <span className="ml-2 text-xs font-normal uppercase text-slate-400">{failure.status}</span></p><p className="mt-1 text-sm text-slate-400">Attempts: {failure.attempts} · Updated {new Date(failure.updatedAt).toLocaleString()}</p>{failure.lastError && <p className="mt-2 max-w-2xl truncate text-xs text-red-200">{failure.lastError}</p>}</div></div>
          <button onClick={() => void retry(failure.id)} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Retry now</button>
        </article>)}</div>}
      </section>
    </main>
  );
}
