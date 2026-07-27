'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, Badge, EmptyState, Skeleton } from '@/components/ui';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  addressLine?: string | null;
  user?: { fullName?: string; phone?: string };
};

export default function VerificationsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    adminFetch('/admin/vendors?verified=false')
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function verify(id: string) {
    setBusy(id);
    try {
      await adminFetch(`/admin/vendors/${id}/verify`, { method: 'PATCH' });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Vendor Verifications"
        subtitle="Approve shops before they appear as verified on Doorli."
        actions={<Badge tone={vendors.length > 0 ? 'warning' : 'success'}>{vendors.length} in queue</Badge>}
      />

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : vendors.length === 0 && !error ? (
        <EmptyState
          icon={<CheckCircle2 size={20} />}
          title="Queue is clear"
          desc="Every registered shop has been reviewed. New signups will land here automatically."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vendors.map((v, i) => (
            <article
              key={v.id}
              className={`glass-card glass-card--interactive glass-card--lit flex flex-col gap-4 p-5 doorli-rise${
                i % 3 === 0 ? '' : i % 3 === 1 ? '-1' : '-2'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#185fa5] to-[#1d9e75] font-display text-base font-bold text-white">
                  {v.businessName?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg font-semibold text-white">{v.businessName}</h3>
                  <Badge tone="info">{v.category}</Badge>
                </div>
              </div>

              <dl className="space-y-1.5 text-sm text-doorli-muted">
                {v.user?.fullName && (
                  <div className="flex items-center gap-2">
                    <User size={14} className="shrink-0 text-doorli-dim" />
                    <span className="truncate">{v.user.fullName}</span>
                  </div>
                )}
                {v.user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="shrink-0 text-doorli-dim" />
                    <span className="truncate">{v.user.phone}</span>
                  </div>
                )}
                {v.addressLine && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-doorli-dim" />
                    <span>{v.addressLine}</span>
                  </div>
                )}
              </dl>

              <button
                onClick={() => verify(v.id)}
                disabled={busy === v.id}
                className="btn btn-accent mt-auto w-full"
              >
                <ShieldCheck size={16} />
                {busy === v.id ? 'Approving…' : 'Approve vendor'}
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
