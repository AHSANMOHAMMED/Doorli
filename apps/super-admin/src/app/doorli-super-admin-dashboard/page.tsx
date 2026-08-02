"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function DoorliSuperAdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      superAdminFetch('/admin/stats'),
      superAdminFetch('/admin/health'),
    ]).then(([statsRes, healthRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (healthRes.success) setHealth(healthRes.data);
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Failed to load dashboard');
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#e5e2e1]">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
        </svg>
        <span>Loading dashboard...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#e5e2e1]">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
        <p className="text-on-surface-variant">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg">Retry</button>
      </div>
    </div>
  );

  const s = stats || {};
  const h = health || {};

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      <header className="w-full top-0 sticky bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">menu</button>
          <h1 className="font-screen-title text-screen-title font-bold text-primary">Doorli Super Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-surface-container rounded-full px-4 py-1 border border-outline-variant mr-4">
            <span className={`w-2 h-2 rounded-full mr-2 ${h.status === 'healthy' ? 'bg-tertiary pulse-ring' : 'bg-error'}`}></span>
            <span className="font-label-medium text-label-medium text-tertiary">{h.status === 'healthy' ? 'System Health: Stable' : 'System Health: Degraded'}</span>
          </div>
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">notifications</button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-24 md:pb-lg">
        <h2 className="font-screen-title text-screen-title text-on-surface mb-lg">Command Center</h2>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <span className="text-caption uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group</span> Total Users
            </span>
            <h2 className="font-kpi-number text-kpi-number text-on-surface mt-base">{s.totalUsers ?? '—'}</h2>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <span className="text-caption uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">store</span> Total Vendors
            </span>
            <h2 className="font-kpi-number text-kpi-number text-on-surface mt-base">{s.totalVendors ?? '—'}</h2>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <span className="text-caption uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span> Total Orders
            </span>
            <h2 className="font-kpi-number text-kpi-number text-on-surface mt-base">{s.totalOrders ?? '—'}</h2>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <span className="text-caption uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified_user</span> Active Vendors
            </span>
            <h2 className="font-kpi-number text-kpi-number text-tertiary mt-base">{s.activeVendors ?? '—'}</h2>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-section-header text-section-header text-on-surface mb-md">System Health</h3>
            <div className="space-y-md">
              <div className="flex justify-between items-center p-sm border-b border-outline-variant/30">
                <span className="text-body-compact">Status</span>
                <span className={`font-label-medium ${h.status === 'healthy' ? 'text-tertiary' : 'text-error'}`}>{h.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center p-sm border-b border-outline-variant/30">
                <span className="text-body-compact">Uptime</span>
                <span className="font-label-medium text-on-surface">{h.uptime ? `${Math.floor(h.uptime / 86400)}d ${Math.floor((h.uptime % 86400) / 3600)}h` : '—'}</span>
              </div>
              <div className="flex justify-between items-center p-sm border-b border-outline-variant/30">
                <span className="text-body-compact">Memory</span>
                <span className="font-label-medium text-on-surface">{h.memory ? `${Math.round(h.memory.heapUsed / 1024 / 1024)}MB` : '—'}</span>
              </div>
              <div className="flex justify-between items-center p-sm">
                <span className="text-body-compact">Environment</span>
                <span className="font-label-medium text-on-surface">{h.environment || '—'}</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <h3 className="font-section-header text-section-header text-on-surface mb-md">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-md">
              <a href="/user-management" className="flex flex-col items-center gap-2 p-md bg-surface-container-high rounded-xl hover:bg-primary-container/20 transition-colors">
                <span className="material-symbols-outlined text-primary">group</span>
                <span className="text-caption font-caption text-on-surface">User Management</span>
              </a>
              <a href="/vendors-management" className="flex flex-col items-center gap-2 p-md bg-surface-container-high rounded-xl hover:bg-primary-container/20 transition-colors">
                <span className="material-symbols-outlined text-primary">store</span>
                <span className="text-caption font-caption text-on-surface">Vendors</span>
              </a>
              <a href="/global-orders" className="flex flex-col items-center gap-2 p-md bg-surface-container-high rounded-xl hover:bg-primary-container/20 transition-colors">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <span className="text-caption font-caption text-on-surface">Orders</span>
              </a>
              <a href="/regional-security-audits" className="flex flex-col items-center gap-2 p-md bg-surface-container-high rounded-xl hover:bg-primary-container/20 transition-colors">
                <span className="material-symbols-outlined text-primary">security</span>
                <span className="text-caption font-caption text-on-surface">Security</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 px-2 pb-safe md:hidden">
        <a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="/">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-medium text-label-medium">Dashboard</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/vendors-management">
          <span className="material-symbols-outlined">store</span>
          <span className="font-label-medium text-label-medium">Vendors</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/user-management">
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-medium text-label-medium">Users</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/global-orders">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-label-medium text-label-medium">Orders</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/erp-synchronization-logs">
          <span className="material-symbols-outlined">sync</span>
          <span className="font-label-medium text-label-medium">Sync</span>
        </a>
      </nav>
    </div>
  );
}
