'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, Panel, Badge, EmptyState, Skeleton } from '@/components/ui';

type InfraService = { name: string; port: string; status: string; url?: string };

export default function HealthPage() {
  const router = useRouter();
  const [infra, setInfra] = useState<InfraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch('/admin/infra');
      setInfra(data.services || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load health');
      setInfra([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  const healthy = infra.filter((s) => s.status === 'healthy').length;

  return (
    <>
      <PageHeader
        title="System Health"
        subtitle="Live probes for marketplace microservices and both ERP backends."
        actions={
          <>
            {infra.length > 0 && (
              <Badge tone={healthy === infra.length ? 'success' : 'warning'}>
                {healthy}/{infra.length} healthy
              </Badge>
            )}
            <button type="button" className="btn btn-ghost" onClick={load}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </>
        }
      />

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      <Panel title="Service probes" icon={<Activity size={17} />}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : infra.length === 0 ? (
          <EmptyState
            icon={<Activity size={20} />}
            title="No probe results"
            desc="Sign in again if the session expired, then refresh."
          />
        ) : (
          <div className="space-y-3">
            {infra.map((s) => (
              <ServiceRow key={s.name} {...s} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function ServiceRow({ name, port, status, url }: InfraService) {
  const healthy = status === 'healthy';
  const down = status === 'down';
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {healthy && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1d9e75] opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              healthy ? 'bg-[#5dcaa5]' : down ? 'bg-[#f2668b]' : 'bg-[#fac775]'
            }`}
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-xs text-doorli-dim">
            {port !== '—' ? `Port ${port}` : 'Not configured'}
            {url ? ` · ${url}` : ''}
          </p>
        </div>
      </div>
      <Badge tone={healthy ? 'success' : down ? 'danger' : 'warning'}>{status}</Badge>
    </div>
  );
}
