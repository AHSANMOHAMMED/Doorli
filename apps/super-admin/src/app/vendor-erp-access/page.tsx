'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

type ModuleState = Record<string, boolean>;

const MODULES = [
  ['dashboard', 'Dashboard', 'Vendor overview and daily operational summary'],
  ['selling', 'Selling', 'Quotes, sales orders, invoices, and customer sales'],
  ['stock', 'Stock', 'Products, inventory, warehouses, and stock movements'],
  ['buying', 'Buying', 'Suppliers, purchase orders, and receipts'],
  ['accounting', 'Accounting', 'Ledgers, payments, taxes, and financial reports'],
  ['reports', 'Reports', 'Operational and financial reporting'],
  ['hr', 'People', 'Employees, attendance, and basic HR workflows'],
  ['restaurant', 'Restaurant', 'Tables, menus, kitchen, and restaurant workflows'],
  ['auto-service', 'Auto Service', 'Vehicle service jobs, parts, and workshop workflows'],
  ['my', 'My Workspace', 'Personal work queue and assigned tasks'],
  ['settings', 'Settings', 'Vendor-level ERP configuration'],
] as const;

export default function VendorErpAccessPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [modules, setModules] = useState<ModuleState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const vendorId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('id') || '';
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setError('No vendor was selected. Open this page from the Vendors screen.');
      setLoading(false);
      return;
    }
    superAdminFetch(`/admin/vendors/${vendorId}`).then(async (vendorResponse) => {
      const selectedVendor = vendorResponse.data;
      setVendor(selectedVendor);
      if (!selectedVendor.erpTenantId || selectedVendor.erpProvider !== 'enterprise') {
        setModules(Object.fromEntries(MODULES.map(([key]) => [key, true])));
        return;
      }
      const statusResponse = await superAdminFetch(`/admin/control/erp/status?tenantId=${encodeURIComponent(selectedVendor.erpTenantId)}&provider=enterprise`);
      const enabled = statusResponse.data?.enabledModules || statusResponse.data?.tenancy?.enabledModules || {};
      setModules(Object.fromEntries(MODULES.map(([key]) => [key, enabled[key] !== false])));
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load vendor ERP access')).finally(() => setLoading(false));
  }, [vendorId]);

  async function toggleModule(moduleKey: string) {
    if (!vendor?.erpTenantId) {
      setError('This vendor does not have an Enterprise ERP tenant yet. Provision the vendor first.');
      return;
    }
    const nextValue = !modules[moduleKey];
    setSaving(moduleKey);
    setError('');
    setNotice('');
    try {
      await superAdminFetch('/admin/control/erp/module', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: vendor.erpTenantId,
          moduleKey,
          isEnabled: nextValue,
          provider: 'enterprise',
        }),
      });
      setModules((current) => ({ ...current, [moduleKey]: nextValue }));
      setNotice(`${MODULES.find(([key]) => key === moduleKey)?.[1] || moduleKey} ${nextValue ? 'enabled' : 'disabled'} for ${vendor.businessName}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update ERP access');
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] text-[#e5e2e1] p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <a href="/vendors-management" className="text-secondary text-sm hover:underline">← Back to vendors</a>
            <p className="text-xs uppercase tracking-[0.2em] text-outline mt-6">Enterprise access control</p>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mt-2">Vendor ERP workspace</h1>
            <p className="text-on-surface-variant mt-2 max-w-2xl">Give each vendor only the tools they need. Changes are saved to the vendor’s real Frappe company and take effect on their ERP workspace.</p>
          </div>
          {vendor && <div className="rounded-2xl border border-surface-variant bg-surface-container p-4 min-w-[250px]"><p className="font-semibold">{vendor.businessName}</p><p className="text-xs text-on-surface-variant mt-1">ERP: {vendor.erpProvider || 'not linked'}</p><p className="text-xs text-on-surface-variant break-all">Tenant: {vendor.erpTenantId || 'not provisioned'}</p></div>}
        </header>

        {loading && <div className="rounded-2xl border border-surface-variant bg-surface-container p-6">Loading live vendor and ERP access…</div>}
        {error && <div className="rounded-2xl border border-error/40 bg-error/10 text-error p-4">{error}</div>}
        {notice && <div className="rounded-2xl border border-tertiary/40 bg-tertiary/10 text-tertiary p-4">{notice}</div>}

        {!loading && vendor && <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map(([key, name, description]) => {
            const enabled = modules[key] !== false;
            return <article key={key} className="rounded-2xl border border-surface-variant bg-surface-container p-5 flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary">{enabled ? 'check_circle' : 'block'}</span><h2 className="font-semibold">{name}</h2></div><p className="text-sm text-on-surface-variant mt-2">{description}</p></div>
              <button type="button" onClick={() => toggleModule(key)} disabled={saving === key || !vendor.erpTenantId} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${enabled ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-highest text-on-surface-variant'} disabled:opacity-50`}>{saving === key ? 'Saving…' : enabled ? 'Enabled' : 'Disabled'}</button>
            </article>;
          })}
        </section>}
      </div>
    </main>
  );
}

