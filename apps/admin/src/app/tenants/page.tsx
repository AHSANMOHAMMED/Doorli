'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Server, Boxes, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { erpDeepLink } from '@/lib/erp';
import { PageHeader, StatCard, Badge, TableShell, EmptyState, Skeleton, Panel } from '@/components/ui';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  erpTenantId?: string | null;
  erpProvider?: 'none' | 'simple' | 'enterprise' | null;
  erpProvisionStatus?: 'none' | 'pending' | 'provisioned' | 'failed' | null;
  erpProvisionError?: string | null;
  isVerified: boolean;
  city?: string | null;
};

type SyncOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  erpOrderId?: string | null;
  erpSyncStatus?: 'pending' | 'synced' | 'failed' | 'skipped' | null;
  erpSyncError?: string | null;
  erpSyncedAt?: string | null;
  createdAt: string;
  vendor?: {
    businessName?: string;
    erpProvider?: string;
    erpTenantId?: string | null;
  };
  customer?: { fullName?: string };
};

function provisionTone(status?: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'provisioned') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}

function syncTone(status?: string | null): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'synced') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  if (status === 'skipped') return 'neutral';
  return 'info';
}

export default function Tenants() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [logs, setLogs] = useState<SyncOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<'all' | 'simple' | 'enterprise' | 'failed'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'failed' | 'pending' | 'skipped'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [vendorData, syncData] = await Promise.all([
        adminFetch('/admin/vendors'),
        adminFetch('/admin/erp/sync-logs'),
      ]);
      const list = Array.isArray(vendorData) ? vendorData : vendorData?.items || [];
      setVendors(list.filter((v: Vendor) => v.erpProvider && v.erpProvider !== 'none'));
      setLogs(Array.isArray(syncData) ? syncData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
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

  async function reprovision(id: string) {
    setBusy(`re-${id}`);
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

  async function resync(orderId: string) {
    setBusy(`sync-${orderId}`);
    try {
      await adminFetch(`/admin/orders/${orderId}/erp-resync`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resync failed');
      await load();
    } finally {
      setBusy(null);
    }
  }

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (providerFilter === 'all') return true;
      if (providerFilter === 'failed') return v.erpProvisionStatus === 'failed';
      return v.erpProvider === providerFilter;
    });
  }, [vendors, providerFilter]);

  const filteredLogs = useMemo(() => {
    if (syncFilter === 'all') return logs;
    return logs.filter((o) => o.erpSyncStatus === syncFilter);
  }, [logs, syncFilter]);

  const simple = vendors.filter((v) => v.erpProvider === 'simple').length;
  const enterprise = vendors.filter((v) => v.erpProvider === 'enterprise').length;
  const failedProvision = vendors.filter((v) => v.erpProvisionStatus === 'failed').length;
  const failedSync = logs.filter((o) => o.erpSyncStatus === 'failed').length;

  return (
    <>
      <PageHeader
        title="ERP Tenants & Sync"
        subtitle="Dual-ERP control plane — Retail Smart and Enterprise provision status plus order sync."
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => { setLoading(true); load(); }}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ERP vendors" value={vendors.length} hint="simple + enterprise" tone="blue" icon={<Building2 size={17} />} delay="doorli-rise" />
        <StatCard label="Retail Smart" value={simple} hint="Embedded ERP" tone="teal" icon={<Boxes size={17} />} delay="doorli-rise-1" />
        <StatCard label="Enterprise" value={enterprise} hint="Frappe companies" tone="gold" icon={<Server size={17} />} delay="doorli-rise-2" />
        <StatCard label="Needs attention" value={failedProvision + failedSync} hint={`${failedProvision} provision · ${failedSync} sync`} tone="rose" icon={<AlertTriangle size={17} />} delay="doorli-rise-3" />
      </div>

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'simple', 'enterprise', 'failed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setProviderFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
              providerFilter === f ? 'bg-white/[0.12] text-white' : 'border border-white/10 text-doorli-muted hover:bg-white/[0.06]'
            }`}
          >
            {f === 'failed' ? 'Provision failed' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          icon={<Building2 size={20} />}
          title="No ERP vendors in this filter"
          desc="Create a vendor with a simple or enterprise tier from the Vendors page."
        />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Business</th>
              <th>ERP tier</th>
              <th>Provisioning</th>
              <th>Tenant / company id</th>
              <th className="text-right">Actions</th>
            </tr>
          }
        >
          {filteredVendors.map((v) => {
            const link = erpDeepLink(v.erpProvider);
            return (
              <tr key={v.id}>
                <td>
                  <p className="font-semibold text-white">{v.businessName}</p>
                  <p className="text-xs text-doorli-dim">{v.city || '—'}</p>
                  {v.erpProvisionError && (
                    <p className="mt-1 max-w-xs text-[11px] text-doorli-rose">{v.erpProvisionError}</p>
                  )}
                </td>
                <td>
                  <Badge tone={v.erpProvider === 'enterprise' ? 'warning' : 'info'}>
                    {v.erpProvider === 'enterprise' ? 'Enterprise' : 'Retail Smart'}
                  </Badge>
                </td>
                <td>
                  <Badge tone={provisionTone(v.erpProvisionStatus)}>{v.erpProvisionStatus || 'none'}</Badge>
                </td>
                <td>
                  {v.erpTenantId ? (
                    <code className="rounded bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-doorli-mint">
                      {v.erpTenantId}
                    </code>
                  ) : (
                    <span className="text-doorli-dim">—</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
                        Open ERP <ExternalLink size={12} />
                      </a>
                    )}
                    {v.erpProvider === 'enterprise' && v.erpProvisionStatus !== 'provisioned' && (
                      <button
                        type="button"
                        className="btn btn-accent"
                        disabled={busy === `re-${v.id}`}
                        onClick={() => reprovision(v.id)}
                      >
                        <RefreshCw size={14} />
                        {busy === `re-${v.id}` ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <Panel
        title="Order sync log"
        icon={<RefreshCw size={17} />}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'synced', 'failed', 'pending', 'skipped'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSyncFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${
                  syncFilter === f ? 'bg-white/[0.12] text-white' : 'text-doorli-muted hover:bg-white/[0.06]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={<RefreshCw size={20} />}
            title="No sync activity yet"
            desc="Orders for ERP-linked vendors will appear here with success or failure status."
          />
        ) : (
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>ERP order</th>
                  <th>When</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <p className="font-mono text-xs font-semibold text-white">{o.orderNumber}</p>
                      <p className="text-xs text-doorli-dim">{o.customer?.fullName || '—'}</p>
                    </td>
                    <td>
                      <p className="text-doorli-muted">{o.vendor?.businessName || '—'}</p>
                      <p className="text-[11px] capitalize text-doorli-dim">{o.vendor?.erpProvider || '—'}</p>
                    </td>
                    <td>
                      <Badge tone={syncTone(o.erpSyncStatus)}>{o.erpSyncStatus || 'unknown'}</Badge>
                      {o.erpSyncError && (
                        <p className="mt-1 max-w-[220px] truncate text-[11px] text-doorli-rose">{o.erpSyncError}</p>
                      )}
                    </td>
                    <td>
                      {o.erpOrderId ? (
                        <code className="font-mono text-[11px] text-doorli-mint">{o.erpOrderId}</code>
                      ) : (
                        <span className="text-doorli-dim">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-doorli-dim">
                      {o.erpSyncedAt
                        ? new Date(o.erpSyncedAt).toLocaleString()
                        : new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="text-right">
                      {(o.erpSyncStatus === 'failed' || o.erpSyncStatus === 'skipped' || !o.erpOrderId) &&
                        o.vendor?.erpProvider &&
                        o.vendor.erpProvider !== 'none' && (
                          <button
                            type="button"
                            className="btn btn-accent"
                            disabled={busy === `sync-${o.id}`}
                            onClick={() => resync(o.id)}
                          >
                            <RefreshCw size={14} />
                            {busy === `sync-${o.id}` ? 'Syncing…' : 'Force resync'}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
