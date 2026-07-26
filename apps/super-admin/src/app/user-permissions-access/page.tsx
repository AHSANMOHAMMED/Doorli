"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserPermissionsAccessPage() {
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    superAdminFetch('/admin/permissions').then(res => {
      if (res.success) setPermissions(res.data);
      setLoading(false);
    });
  }, []);

  const handleToggle = (key: string) => {
    if (!permissions) return;
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await superAdminFetch('/admin/permissions', {
      method: 'PATCH',
      body: JSON.stringify(permissions)
    });
    if (res.success) alert('Permissions saved successfully!');
    else alert('Failed to save permissions');
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      {/* Top Navigation */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-background z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors" type="button">menu</button>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Super Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary" data-icon="terminal">terminal</span>
            <span className="text-caption font-caption text-on-surface-variant">NODE_04_STABLE</span>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors" type="button">notifications</button>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-xs">SA</div>
        </div>
      </header>
      {/* Main Content Area */}
      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-32">
        {/* Header Section */}
        <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-3xl text-primary" data-icon="shield_person">shield_person</span>
              <h2 className="font-screen-title text-screen-title text-on-surface">Role Configuration</h2>
            </div>
            <p className="text-on-surface-variant font-body-compact text-body-compact">Define access matrices and operational boundaries for specific system roles.</p>
          </div>
          <div className="flex gap-2">
            <select className="bg-surface-container-high border border-surface-variant text-on-surface rounded-xl px-4 py-2 font-label-medium focus:outline-none focus:border-primary transition-colors appearance-none">
              <option>Role: Support Tech</option>
              <option>Role: Data Analyst</option>
              <option>Role: Sub-Admin</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-3 text-on-surface-variant">
              {/* Dropdown arrow mock */}
            </div>
          </div>
        </div>
        {/* Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Category: Core Modules */}
          <div className="md:col-span-12 lg:col-span-12">
            <div className="flex items-center gap-2 mb-sm">
              <span className="material-symbols-outlined text-primary" data-icon="grid_view">grid_view</span>
              <h3 className="font-section-header text-section-header text-primary">Core Modules</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
              {/* Global View */}
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl hover:border-primary/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-medium text-on-surface">Global View</span>
                  <label className="switch">
                    <input type="checkbox" checked={permissions?.globalView} onChange={() => handleToggle('globalView')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="text-caption text-on-surface-variant">Read-only access to all dashboards and high-level metrics.</p>
              </div>
              {/* Create & Delete */}
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl hover:border-primary/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-medium text-on-surface">Create &amp; Delete</span>
                  <label className="switch">
                    <input type="checkbox" checked={permissions?.createDelete} onChange={() => handleToggle('createDelete')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="text-caption text-on-surface-variant">Privilege to provision or remove standard records.</p>
              </div>
              {/* Vendor Management */}
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl hover:border-primary/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-medium text-on-surface">Vendor Management</span>
                  <label className="switch">
                    <input type="checkbox" checked={permissions?.vendorManagement} onChange={() => handleToggle('vendorManagement')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="text-caption text-on-surface-variant">Ability to approve, suspend, or modify vendor profiles.</p>
              </div>
              {/* User Accounts */}
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl hover:border-primary/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-medium text-on-surface">User Accounts</span>
                  <label className="switch">
                    <input type="checkbox" checked={permissions?.userAccounts} onChange={() => handleToggle('userAccounts')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="text-caption text-on-surface-variant">Administer user accounts, roles, and authentication protocols.</p>
              </div>
              {/* Orders */}
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl hover:border-secondary/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-medium text-on-surface">Orders</span>
                  <label className="switch">
                    <input type="checkbox" checked={permissions?.orders} onChange={() => handleToggle('orders')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="text-caption text-on-surface-variant">Full lifecycle visibility into transaction history and active processing.</p>
              </div>
            </div>
          </div>
          {/* Category: Advanced Actions */}
          <div className="md:col-span-12 lg:col-span-6 mt-lg">
            <div className="flex items-center gap-2 mb-sm">
              <span className="material-symbols-outlined text-tertiary" data-icon="settings_suggest">settings_suggest</span>
              <h3 className="font-section-header text-section-header text-tertiary">Advanced Actions</h3>
            </div>
            <div className="space-y-sm">
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">Force ERP Sync</span>
                  <p className="text-caption text-on-surface-variant">Manually trigger data synchronization between local state and enterprise ERP.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.forceErpSync} onChange={() => handleToggle('forceErpSync')} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">Global Broadcasts</span>
                  <p className="text-caption text-on-surface-variant">Send high-priority system-wide notifications to all active terminal users.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.globalBroadcasts} onChange={() => handleToggle('globalBroadcasts')} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">System Settings</span>
                  <p className="text-caption text-on-surface-variant">Modify base environment variables and core platform configuration strings.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.systemSettings} onChange={() => handleToggle('systemSettings')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
          {/* Category: Security */}
          <div className="md:col-span-12 lg:col-span-6 mt-lg">
            <div className="flex items-center gap-2 mb-sm">
              <span className="material-symbols-outlined text-primary-container" data-icon="gpp_maybe">gpp_maybe</span>
              <h3 className="font-section-header text-section-header text-primary-container">Security &amp; Integrity</h3>
            </div>
            <div className="space-y-sm">
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">Bypass MFA</span>
                  <p className="text-caption text-on-surface-variant">Allow single-factor authentication for emergency bypass protocols.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.bypassMfa} onChange={() => handleToggle('bypassMfa')} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">Delete Entities</span>
                  <p className="text-caption text-on-surface-variant">Hard-delete records from the production database without archival.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.deleteEntities} onChange={() => handleToggle('deleteEntities')} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="bg-surface-container-high p-md border border-surface-variant rounded-xl flex items-center justify-between">
                <div className="pr-md">
                  <span className="font-label-medium text-on-surface block">Audit Export</span>
                  <p className="text-caption text-on-surface-variant">Download encrypted system logs and immutable transaction trails.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={permissions?.auditExport} onChange={() => handleToggle('auditExport')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* System Stats / Footer Canvas */}
        <div className="mt-xl grid grid-cols-2 md:grid-cols-4 gap-gutter border-t border-surface-variant pt-lg opacity-60">
          <div className="flex flex-col">
            <span className="text-caption uppercase tracking-widest text-on-surface-variant">Permission Level</span>
            <span className="font-label-medium text-on-surface">Lvl 10 - Root Access</span>
          </div>
          <div className="flex flex-col">
            <span className="text-caption uppercase tracking-widest text-on-surface-variant">Org ID</span>
            <span className="font-label-medium text-on-surface">DRLI-XC-9021</span>
          </div>
          <div className="flex flex-col">
            <span className="text-caption uppercase tracking-widest text-on-surface-variant">Compliance</span>
            <span className="font-label-medium text-on-surface">Tier-4 Audited</span>
          </div>
          <div className="flex flex-col">
            <span className="text-caption uppercase tracking-widest text-on-surface-variant">Encryption</span>
            <span className="font-label-medium text-on-surface">AES-256 Quantum</span>
          </div>
        </div>
      </main>
      {/* Fixed Bottom Actions Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant p-4 z-50">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container animate-pulse" data-icon="sync">sync</span>
            <span className="text-caption text-on-surface-variant italic">Changes not yet committed to system core...</span>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-xl border border-surface-variant font-label-medium text-on-surface-variant hover:bg-surface-variant transition-colors active:scale-95 duration-100" type="button">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-xl bg-primary-container text-white font-label-medium hover:brightness-110 shadow-[0_0_20px_rgba(255,83,91,0.2)] transition-all active:scale-95 duration-100 flex items-center gap-2 disabled:opacity-50" type="button">
              <span className="material-symbols-outlined text-sm" data-icon="save">save</span>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </footer>
      {/* Bottom Navigation Component */}
      <nav className="md:hidden fixed bottom-16 w-full z-40 bg-surface-container text-on-surface-variant flex justify-around items-center h-16 shadow-lg border-t border-surface-variant">
        <div className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
          <span className="text-label-medium font-label-medium">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" data-icon="storefront">storefront</span>
          <span className="text-label-medium font-label-medium">Vendors</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-xl px-3 py-1">
          <span className="material-symbols-outlined" data-icon="group">group</span>
          <span className="text-label-medium font-label-medium">Users</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" data-icon="package_2">package_2</span>
          <span className="text-label-medium font-label-medium">Orders</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined" data-icon="menu">menu</span>
          <span className="text-label-medium font-label-medium">More</span>
        </div>
      </nav>
    </div>
  );
}
