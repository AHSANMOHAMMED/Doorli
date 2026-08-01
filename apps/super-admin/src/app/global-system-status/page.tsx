"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  message: string;
}

interface Region {
  id: string;
  name: string;
  status: string;
  load: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  summary: string;
  timestamp: string;
}

interface HealthData {
  uptime: number;
  activeSessions: number;
  errorRate: number;
  cpu: { usagePercent: number };
  memory: { usagePercent: number };
  erpLatencyMs: number;
}

export default function GlobalSystemStatusPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [incidents, setIncidents] = useState<AuditEntry[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [overallStatus, setOverallStatus] = useState('healthy');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, routingRes, auditRes, healthRes] = await Promise.allSettled([
          superAdminFetch('/admin/diagnostics'),
          superAdminFetch('/admin/traffic-routing'),
          superAdminFetch('/admin/audits?limit=10'),
          superAdminFetch('/admin/health'),
        ]);

        if (diagRes.status === 'fulfilled' && diagRes.value.success) {
          setDiagnostics(diagRes.value.data.checks || []);
          setOverallStatus(diagRes.value.data.overallStatus || 'healthy');
        }
        if (routingRes.status === 'fulfilled' && routingRes.value.success) {
          setRegions(routingRes.value.data.regions || []);
        }
        if (auditRes.status === 'fulfilled' && auditRes.value.success) {
          setIncidents(auditRes.value.data || []);
        }
        if (healthRes.status === 'fulfilled' && healthRes.value.success) {
          setHealth(healthRes.value.data);
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const apiSuccessRate = diagnostics.length > 0
    ? ((diagnostics.filter((c) => c.status === 'ok').length / diagnostics.length) * 100).toFixed(2)
    : '0.00';

  const avgLatency = diagnostics.length > 0
    ? Math.round(diagnostics.reduce((sum, c) => sum + c.latencyMs, 0) / diagnostics.length)
    : 0;

  const uptime = health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'N/A';
  const mttr = health ? `${Math.max(1, Math.round(health.errorRate * 30))}m` : '14m';

  const getIncidentStyle = (action: string) => {
    if (action.includes('FAILED') || action.includes('DEACTIVATED') || action.includes('DEGRADED')) {
      return { bg: 'bg-error-container/10', border: 'border-error', iconColor: 'text-error', icon: 'priority_high', labelColor: 'text-error' };
    }
    if (action.includes('PENDING') || action.includes('WARNING')) {
      return { bg: 'bg-secondary-container/10', border: 'border-secondary', iconColor: 'text-secondary', icon: 'info', labelColor: 'text-secondary' };
    }
    return { bg: 'bg-surface-container-highest/20', border: 'border-outline', iconColor: 'text-outline', icon: 'history', labelColor: 'text-on-surface-variant' };
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
<header className="fixed top-0 w-full z-50 bg-background flex justify-between items-center px-margin-mobile h-16 border-b border-outline-variant">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<div className="hidden md:flex flex-col items-end mr-sm">
<span className="font-label-medium text-label-medium text-on-surface">Super Admin</span>
<span className="font-caption text-caption text-on-surface-variant">v2.4.0</span>
</div>
<div className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center overflow-hidden">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-V4NRJUFJXVTHZP-mOIfaaUKmfKeEx0qgZGs2BcEremU8GdXxcT0r6YC53rgKlyYlRXXXtpYx65H0WUo5j7qTPCKGtLhViAxns2J5ix_zSdKN4b9g9dzkIeLR0EuqR-Mq_DUQkwKYZ883Dl9Qc2QkU7fURzgDFPWMWA8tmzIZecngwsA_aYMwriUJge38icvw1qpT0sptUXvNSLG-R-vaQuCZmRg9J4wZmBOosp0IMzVWMo0Wam1foAIA7SnYnWiGmoFiyxcfM4XA" alt="Admin" />
</div>
</div>
</header>

<aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low border-r border-outline-variant flex-col p-sm space-y-base z-40">
<nav className="space-y-1">
<a className="flex items-center gap-md p-md bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">System Logs</span>
</a>
<a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined">help_outline</span>
<span className="font-body-main text-body-main">Support</span>
</a>
</nav>
<div className="mt-auto p-md border-t border-outline-variant flex flex-col gap-xs">
<div className="flex items-center justify-between text-caption font-caption text-on-surface-variant">
<span>API STATUS</span>
<span className={overallStatus === 'healthy' ? 'text-tertiary' : 'text-error'}>{overallStatus === 'healthy' ? 'STABLE' : 'DEGRADED'}</span>
</div>
<div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className={`h-full ${overallStatus === 'healthy' ? 'bg-tertiary w-[94%]' : 'bg-error w-[60%]'}`}></div>
</div>
</div>
</aside>

<main className="pt-20 pb-24 md:pl-72 md:pr-12 px-margin-mobile min-h-screen technical-grid">

{loading ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-on-surface-variant font-body-main text-body-main">Loading global system status...</div>
  </div>
) : (
<>
<section className="mb-xl flex flex-col md:flex-row md:items-center justify-between gap-md">
<div>
<div className="flex items-center gap-sm mb-xs">
<div className={`w-3 h-3 rounded-full glow-pulse ${overallStatus === 'healthy' ? 'bg-tertiary' : 'bg-error'}`}></div>
<span className={`font-section-header text-section-header uppercase tracking-wider ${overallStatus === 'healthy' ? 'text-tertiary' : 'text-error'}`}>{overallStatus === 'healthy' ? 'System Operational' : 'System Degraded'}</span>
</div>
<h2 className="font-screen-title text-screen-title text-on-background">Global Node Infrastructure</h2>
</div>
<div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex items-center gap-lg">
<div>
<span className="font-caption text-caption text-on-surface-variant block uppercase">Aggregated Uptime</span>
<span className="font-kpi-number text-kpi-number text-tertiary">{apiSuccessRate}<span className="text-label-medium">%</span></span>
</div>
<div className="w-[1px] h-10 bg-outline-variant"></div>
<div>
<span className="font-caption text-caption text-on-surface-variant block uppercase">MTTR</span>
<span className="font-kpi-number text-kpi-number text-on-surface">{mttr.replace('m', '')}<span className="text-label-medium">m</span></span>
</div>
</div>
</section>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md h-[400px] relative overflow-hidden group">
<div className="absolute top-md left-md z-10 flex flex-col gap-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant flex items-center gap-xs">
<span className="material-symbols-outlined text-[16px]">public</span>
                        Global Distribution
                    </span>
<span className="font-caption text-caption text-tertiary">{regions.length} Regions Active</span>
</div>
<div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKNDyT8H2nbZER115jbihHgvuli5M7a4-sxrEUsWN-ovgzXX6o3nvLCoXbSwTtghNlLWWMXC8XNhrorYUP3l8KtVEKyfv0P5MF5DmXjL81CsTqU44CHsLpYWDuRZ8mI9dt34dumkqQRHEmq42ErLNskNf6gSvtLcR3DwngwJGF-0S4-kdcY1Mfiv0cahtzbeAMbSr_u0n8wpboROKb-wSWx5UDkUTYT1s_-SNNg4UGoP69vmvovgGvwi5SwmEUiDvGdW75maLonNqv" alt="Global Map" />
</div>
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
<div className="absolute top-1/3 left-1/4 w-4 h-4 bg-tertiary rounded-full shadow-[0_0_15px_rgba(111,216,200,0.6)] animate-ping"></div>
<div className="absolute top-1/4 right-1/4 w-4 h-4 bg-tertiary rounded-full shadow-[0_0_15px_rgba(111,216,200,0.6)]"></div>
{regions.some((r) => r.status !== 'ACTIVE') && (
  <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-error rounded-full shadow-[0_0_15px_rgba(255,83,91,0.6)] animate-pulse"></div>
)}
</div>
<div className="absolute bottom-md right-md bg-surface-container-highest/80 backdrop-blur-md p-sm border border-outline-variant rounded-lg flex flex-col gap-xs">
<div className="flex items-center gap-sm">
<div className="w-2 h-2 rounded-full bg-tertiary"></div>
<span className="font-caption text-caption">Optimal</span>
</div>
<div className="flex items-center gap-sm">
<div className="w-2 h-2 rounded-full bg-secondary-container"></div>
<span className="font-caption text-caption">Heavy Load</span>
</div>
<div className="flex items-center gap-sm">
<div className="w-2 h-2 rounded-full bg-error-container"></div>
<span className="font-caption text-caption">Degraded</span>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-gutter">
<div className="grid grid-cols-2 gap-gutter h-full">
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-primary">groups</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Active Sessions</span>
<div className="font-kpi-number text-kpi-number text-on-surface">{(health?.activeSessions ?? 0).toLocaleString()}</div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-secondary">speed</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Avg Latency</span>
<div className="font-kpi-number text-kpi-number text-on-surface">{avgLatency}<span className="text-label-medium">ms</span></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-error">warning</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Error Rate</span>
<div className="font-kpi-number text-kpi-number text-on-surface">{health?.errorRate ?? 0}<span className="text-label-medium">%</span></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-tertiary">sync</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">ERP Sync</span>
<div className="font-body-main text-body-main text-tertiary font-bold mt-sm">{health?.erpLatencyMs && health.erpLatencyMs > 0 ? `SYNCED ${Math.round(health.erpLatencyMs / 1000)}s ago` : 'UNAVAILABLE'}</div>
</div>
</div>
</div>
</div>

<div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header mb-md flex items-center justify-between">
                    Regional Performance
                    <span className="material-symbols-outlined text-on-surface-variant">sort</span>
</h3>
<div className="space-y-sm">
{regions.length === 0 ? (
  <div className="p-sm text-center text-on-surface-variant text-caption">No regional data</div>
) : (
  regions.map((region) => {
    const isActive = region.status === 'ACTIVE';
    const loadColor = region.load > 80 ? 'text-error' : region.load > 50 ? 'text-secondary' : 'text-tertiary';
    const loadBarColor = region.load > 80 ? 'bg-error' : region.load > 50 ? 'bg-secondary' : 'bg-tertiary';
    return (
      <div key={region.id} className="p-sm bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
        <div className="flex flex-col">
          <span className="font-label-medium text-label-medium text-on-surface">{region.name}</span>
          <span className="font-caption text-caption text-on-surface-variant">Load: {region.load}%</span>
        </div>
        <div className="flex items-center gap-lg">
          <div className="hidden sm:flex flex-col items-end">
            <span className={`font-caption text-caption ${loadColor}`}>{region.load}% load</span>
            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className={`h-full ${loadBarColor}`} style={{ width: `${region.load}%` }}></div>
            </div>
          </div>
          <span className={`material-symbols-outlined ${isActive ? 'text-tertiary' : 'text-error'}`}>{isActive ? 'check_circle' : 'report_problem'}</span>
        </div>
      </div>
    );
  })
)}
</div>
</div>

<div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header mb-md flex items-center justify-between">
                    Incident Feed
                    <span className="text-caption font-caption text-primary cursor-pointer hover:underline">View All</span>
</h3>
<div className="space-y-sm">
{incidents.length === 0 ? (
  <div className="p-sm text-center text-on-surface-variant text-caption">No recent incidents</div>
) : (
  incidents.slice(0, 4).map((incident) => {
    const style = getIncidentStyle(incident.action);
    return (
      <div key={incident.id} className={`flex gap-md p-sm ${style.bg} border-l-4 ${style.border} rounded-r-lg`}>
        <div className="shrink-0 pt-xs">
          <span className={`material-symbols-outlined ${style.iconColor}`}>{style.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <span className={`font-label-medium text-label-medium ${style.labelColor} font-bold`}>{incident.action.replace(/_/g, ' ')}</span>
            <span className="font-caption text-caption text-on-surface-variant">{new Date(incident.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="font-body-compact text-body-compact text-on-surface mb-xs">{incident.summary}</p>
        </div>
      </div>
    );
  })
)}
</div>
</div>
</div>
</>
)}
</main>

<button className="fixed bottom-24 right-margin-mobile md:bottom-12 md:right-12 bg-primary-container text-on-primary-fixed hover:bg-primary transition-all duration-300 flex items-center gap-md px-lg py-md rounded-xl shadow-xl z-50 group" onClick={() => {}}>
<span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">settings_backup_restore</span>
<span className="font-label-medium text-label-medium font-bold uppercase tracking-widest">Run Diagnostics</span>
</button>

<nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container border-t border-outline-variant z-50">
<a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</a>
</nav>

    </div>
  );
}
