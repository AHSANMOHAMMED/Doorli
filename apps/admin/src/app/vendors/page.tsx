'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Search, Store, BadgeCheck, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { erpDeepLink } from '@/lib/erp';
import { PageHeader, Badge, TableShell, EmptyState, Skeleton, Panel } from '@/components/ui';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  city?: string | null;
  isVerified: boolean;
  isOpen: boolean;
  erpProvider?: 'none' | 'simple' | 'enterprise' | null;
  erpTenantId?: string | null;
  erpProvisionStatus?: 'none' | 'pending' | 'provisioned' | 'failed' | null;
  erpProvisionError?: string | null;
  user?: { fullName?: string; phone?: string; email?: string };
};

function provisionTone(status?: string | null): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'provisioned') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    tier: 'simple' as 'none' | 'simple' | 'enterprise',
    erpTenantId: '',
  });
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const load = () =>
    adminFetch('/admin/vendors')
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

  async function reprovision(id: string) {
    setBusy(`re-${id}`);
    setError(null);
    try {
      await adminFetch(`/admin/vendors/${id}/reprovision`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reprovision failed');
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function createVendor(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    setError(null);
    try {
      const data = await adminFetch('/admin/vendors', {
        method: 'POST',
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          tier: form.tier,
          erpTenantId: form.tier === 'simple' && form.erpTenantId.trim() ? form.erpTenantId.trim() : undefined,
        }),
      });
      setCreateMsg(
        data.erpProvider === 'enterprise'
          ? `Enterprise vendor created — provision ${data.erpProvisionStatus}.`
          : `Vendor created (${data.erpProvider || 'none'}).`,
      );
      setForm({ businessName: '', email: '', phone: '', tier: 'simple', erpTenantId: '' });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      await load();
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [v.businessName, v.category, v.city, v.user?.fullName, v.user?.phone, v.erpProvider, v.erpTenantId]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q)),
    );
  }, [vendors, query]);

  const verifiedCount = vendors.filter((v) => v.isVerified).length;

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Create shops, choose ERP tier, and manage marketplace verification."
        actions={
          <>
            <Badge tone="success">{verifiedCount} verified</Badge>
            <Badge tone="warning">{vendors.length - verifiedCount} pending</Badge>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
              <Plus size={16} />
              {showCreate ? 'Close' : 'Create vendor'}
            </button>
          </>
        }
      />

      {showCreate && (
        <Panel title="Create vendor" icon={<Plus size={17} />}>
          <form onSubmit={createVendor} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-doorli-muted">Business name</span>
              <input
                className="input"
                required
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                placeholder="Corner Grocery"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-doorli-muted">Admin email</span>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="owner@shop.lk"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-doorli-muted">Phone (optional)</span>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+9477…"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-doorli-muted">ERP tier</span>
              <select
                className="input"
                value={form.tier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tier: e.target.value as 'none' | 'simple' | 'enterprise' }))
                }
              >
                <option value="none">None — marketplace only</option>
                <option value="simple">Retail Smart (simple)</option>
                <option value="enterprise">Enterprise (Frappe)</option>
              </select>
            </label>
            {form.tier === 'simple' && (
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-doorli-muted">
                  Retail Smart tenant id (optional — link an existing company)
                </span>
                <input
                  className="input font-mono text-sm"
                  value={form.erpTenantId}
                  onChange={(e) => setForm((f) => ({ ...f, erpTenantId: e.target.value }))}
                  placeholder="tenant uuid or company key"
                />
              </label>
            )}
            {form.tier === 'enterprise' && (
              <p className="sm:col-span-2 text-sm text-doorli-muted">
                Enterprise vendors are auto-provisioned against Frappe. You can retry from the table if
                provisioning fails.
              </p>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Creating…' : 'Create vendor'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {createMsg && (
        <p className="rounded-xl border border-[rgba(93,202,165,0.3)] bg-[rgba(29,158,117,0.12)] px-4 py-3 text-sm text-doorli-mint">
          {createMsg}
        </p>
      )}

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-doorli-dim" />
        <input
          className="input pl-10"
          placeholder="Search vendors…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Store size={20} />}
          title={query ? 'No vendors match that search' : 'No vendors yet'}
          desc={query ? 'Try a different business name, city, or phone number.' : 'Create the first shop above.'}
        />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Business</th>
              <th>ERP tier</th>
              <th>Provision</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          }
        >
          {filtered.map((v) => {
            const link = erpDeepLink(v.erpProvider);
            return (
              <tr key={v.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#185fa5]/70 to-[#1d9e75]/70 font-display text-sm font-bold text-white">
                      {v.businessName?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{v.businessName}</p>
                      <p className="truncate text-xs text-doorli-dim">
                        {v.user?.email || v.user?.phone || v.city || '—'}
                      </p>
                      {v.erpTenantId && (
                        <code className="mt-0.5 block truncate font-mono text-[10px] text-doorli-mint">
                          {v.erpTenantId}
                        </code>
                      )}
                      {v.erpProvisionError && (
                        <p className="mt-0.5 max-w-xs truncate text-[11px] text-doorli-rose">{v.erpProvisionError}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={v.erpProvider === 'enterprise' ? 'warning' : v.erpProvider === 'simple' ? 'info' : 'neutral'}>
                    {v.erpProvider === 'enterprise'
                      ? 'Enterprise'
                      : v.erpProvider === 'simple'
                        ? 'Retail Smart'
                        : 'None'}
                  </Badge>
                </td>
                <td>
                  <Badge tone={provisionTone(v.erpProvisionStatus)}>{v.erpProvisionStatus || 'none'}</Badge>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={v.isVerified ? 'success' : 'warning'}>{v.isVerified ? 'Verified' : 'Pending'}</Badge>
                    <Badge tone={v.isOpen ? 'info' : 'neutral'}>{v.isOpen ? 'Open' : 'Closed'}</Badge>
                  </div>
                </td>
                <td className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost inline-flex items-center gap-1.5 text-xs"
                      >
                        Open ERP <ExternalLink size={12} />
                      </a>
                    )}
                    {v.erpProvider === 'enterprise' && v.erpProvisionStatus === 'failed' && (
                      <button
                        type="button"
                        onClick={() => reprovision(v.id)}
                        disabled={busy === `re-${v.id}`}
                        className="btn btn-accent"
                      >
                        <RefreshCw size={14} />
                        {busy === `re-${v.id}` ? 'Retrying…' : 'Retry provision'}
                      </button>
                    )}
                    {v.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-doorli-dim">
                        <BadgeCheck size={14} className="text-doorli-mint" />
                        Approved
                      </span>
                    ) : (
                      <button type="button" onClick={() => verify(v.id)} disabled={busy === v.id} className="btn btn-accent">
                        {busy === v.id ? 'Verifying…' : 'Verify'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </>
  );
}
