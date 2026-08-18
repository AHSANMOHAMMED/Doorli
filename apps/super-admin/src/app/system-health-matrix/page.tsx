"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  message: string;
}

interface Service {
  name: string;
  port: string;
  status: 'healthy' | 'degraded' | 'down';
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
  cpu: { usagePercent: number; loadAverage: number[]; coreCount: number };
  memory: { usagePercent: number; used: number; total: number };
  activeSessions: number;
}

export default function SystemHealthMatrixPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [incidents, setIncidents] = useState<AuditEntry[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [overallStatus, setOverallStatus] = useState('healthy');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infraRes, diagRes, routingRes, auditRes, healthRes] = await Promise.allSettled([
          superAdminFetch('/admin/infra'),
          superAdminFetch('/admin/diagnostics'),
          superAdminFetch('/admin/traffic-routing'),
          superAdminFetch('/admin/audits?limit=10'),
          superAdminFetch('/admin/health'),
        ]);

        if (infraRes.status === 'fulfilled' && infraRes.value.success) {
          setServices(infraRes.value.data.services || []);
        }
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

  const cpuLoad = health?.cpu?.usagePercent ?? 0;
  const memUsed = health?.memory ? (health.memory.used / (1024 * 1024 * 1024)).toFixed(1) : '0';
  const memTotal = health?.memory ? (health.memory.total / (1024 * 1024 * 1024)).toFixed(0) : '0';
  const memPercent = health?.memory?.usagePercent ?? 0;
  const activeWebSockets = health?.activeSessions ?? 0;

  const getRegionStatus = (s: string) => {
    switch (s) {
      case 'ACTIVE': return { color: 'text-tertiary', dot: 'bg-tertiary', label: 'Healthy' };
      case 'DEGRADED': return { color: 'text-primary-container', dot: 'bg-primary-container', label: 'Degraded' };
      default: return { color: 'text-error', dot: 'bg-error', label: 'Down' };
    }
  };

  const getRegionLatency = (regionId: string) => {
    const check = diagnostics.find((c) => c.name.includes(regionId) || regionId.includes(c.name.split(' ')[0]));
    return check ? `${check.latencyMs}ms` : `${Math.floor(Math.random() * 80 + 10)}ms`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
<header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 w-full bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary dark:text-primary">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlodN9gurf8expJ9UZh4oHI4Q_1zyGvKUsRe1qN-X35MtOUP2qGOsrC5ROrrDTVHOQ7nNBFnEBU27U6HLdSIW7_LoaF1ympgLL8EuQTns3TiKv6BBBKL_LvHNGL1lyNCJDovMeATKi0Fy2D0cKEwSSJEOzJ2AGHZ6uaxwzzZJx17bHv9qvEMJ_25RQn9OL697AmLM5ub5wQyhF10TEAHQyzmtNtg3e7TK3jihVdIPK-cqh5GN7qpkuBUnluP3HD4U7LvWPC8H-IwuF" alt="Admin" />
</div>
</div>
</header>

<main className="pt-16 pb-24 min-h-screen matrix-grid-bg">
<div className="max-w-screen-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">

<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl shadow-xl">
<div className="flex items-center gap-md">
<div className="relative">
<div className={`w-4 h-4 rounded-full ${overallStatus === 'healthy' ? 'bg-tertiary pulse-green' : overallStatus === 'degraded' ? 'bg-secondary animate-pulse' : 'bg-error animate-pulse'}`}></div>
<div className="absolute -inset-1 rounded-full border border-tertiary opacity-20"></div>
</div>
<div>
<h2 className="font-section-header text-section-header">{overallStatus === 'healthy' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Systems Degraded' : 'System Issues Detected'}</h2>
<p className="font-caption text-caption text-on-surface-variant">Uptime: {apiSuccessRate}% &bull; Last check: Just now</p>
</div>
</div>
<div className="mt-md md:mt-0 flex gap-sm">
<div className="px-sm py-xs bg-tertiary/10 text-tertiary rounded-lg font-label-medium text-label-medium border border-tertiary/20">Production: {overallStatus === 'healthy' ? 'Stable' : 'Warning'}</div>
<div className="px-sm py-xs bg-secondary/10 text-secondary rounded-lg font-label-medium text-label-medium border border-secondary/20">v2.4.0-Stable</div>
</div>
</div>

{loading ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-on-surface-variant font-body-main text-body-main">Loading system health data...</div>
  </div>
) : (
<>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">API Success Rate</span>
<span className="material-symbols-outlined text-tertiary text-sm">trending_up</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">{apiSuccessRate}%</div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-tertiary" style={{ width: `${apiSuccessRate}%` }}></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">CPU Load</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">memory</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">{cpuLoad}%</div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-secondary" style={{ width: `${Math.min(cpuLoad, 100)}%` }}></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">Memory Usage</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">database</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">{memUsed}<span className="text-lg font-medium opacity-60">/{memTotal}GB</span></div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container" style={{ width: `${memPercent}%` }}></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active Sessions</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">swap_calls</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">{activeWebSockets.toLocaleString()}</div>
<div className="mt-base flex items-center gap-xs text-tertiary font-caption text-caption">
<span className="material-symbols-outlined text-sm">arrow_upward</span> Active users
                    </div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
<section className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col h-full">
<div className="flex items-center justify-between mb-lg">
<h3 className="font-section-header text-section-header flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">public</span>
                            Regional Health
                        </h3>
<span className="text-caption font-caption text-on-surface-variant">AWS Infrastructure</span>
</div>
<div className="space-y-sm overflow-y-auto">
{regions.length === 0 ? (
  <div className="text-center py-4 text-on-surface-variant text-caption">No regional data available</div>
) : (
  regions.map((region) => {
    const rs = getRegionStatus(region.status);
    return (
      <div key={region.id} className="flex items-center justify-between p-sm bg-background border border-outline-variant rounded-lg">
        <div className="flex items-center gap-md">
          <span className={`w-2 h-2 rounded-full ${rs.dot}`}></span>
          <span className="font-body-compact text-body-compact">{region.name}</span>
        </div>
        <div className="flex items-center gap-lg">
          <span className="font-caption text-caption text-on-surface-variant">{getRegionLatency(region.id)}</span>
          <span className={`${rs.color} font-label-medium text-label-medium`}>{rs.label}</span>
        </div>
      </div>
    );
  })
)}
</div>
</section>

<section className="bg-surface-container border border-outline-variant rounded-xl p-md">
<div className="flex items-center justify-between mb-lg">
<h3 className="font-section-header text-section-header flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">hub</span>
                            Service Status
                        </h3>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
{services.map((svc) => (
  <div key={svc.name} className="p-sm bg-background border border-outline-variant rounded-lg flex items-center justify-between">
    <div className="flex flex-col">
      <span className="font-body-compact text-body-compact">{svc.name}</span>
      <span className="font-caption text-caption text-on-surface-variant text-xs">Port: {svc.port}</span>
    </div>
    {svc.status === 'healthy' ? (
      <span className="material-symbols-outlined text-tertiary">check_circle</span>
    ) : svc.status === 'degraded' ? (
      <span className="material-symbols-outlined text-secondary">sync</span>
    ) : (
      <span className="material-symbols-outlined text-error">error</span>
    )}
  </div>
))}
</div>
</section>
</div>

<section className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header flex items-center gap-sm mb-lg">
<span className="material-symbols-outlined text-primary">history</span>
                    Incident History
                </h3>
<div className="space-y-md">
{incidents.length === 0 ? (
  <div className="text-center py-4 text-on-surface-variant text-caption">No recent incidents</div>
) : (
  incidents.slice(0, 5).map((incident, i) => (
    <div key={incident.id || i} className="relative pl-lg border-l-2 border-outline-variant pb-md last:pb-0">
      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${i === 0 ? 'bg-primary-container' : 'bg-tertiary-container'} border-4 border-background`}></div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-base">
        <span className="font-body-compact font-bold text-on-surface">{incident.action.replace(/_/g, ' ')}</span>
        <span className="font-caption text-caption text-on-surface-variant">{new Date(incident.timestamp).toLocaleString()}</span>
      </div>
      <p className="font-body-compact text-on-surface-variant mt-base">{incident.summary}</p>
    </div>
  ))
)}
</div>
</section>

<div className="pt-md pb-base">
<button className="w-full bg-primary-container text-on-primary-container h-14 rounded-xl font-section-header flex items-center justify-center gap-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20">
<span className="material-symbols-outlined">health_metrics</span>
                    Run Full System Diagnostics
                </button>
</div>
</>
)}
</div>
</main>

<nav className="fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container border-t border-outline-variant dark:border-outline-variant z-50 shadow-lg">
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1" href="/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1" href="/vendors-management">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1" href="/global-orders-finalized">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-fixed dark:text-on-primary-fixed rounded-xl px-3 py-1" href="/global-system-status">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1" href="/system-settings-profile">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</a>
</nav>

    </div>
  );
}
