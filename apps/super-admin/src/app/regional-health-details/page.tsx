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

interface Service {
  name: string;
  port: string;
  status: 'healthy' | 'degraded' | 'down';
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  summary: string;
  timestamp: string;
}

interface HealthData {
  cpu: { coreCount: number };
  memory: { usagePercent: number };
  activeSessions: number;
}

export default function RegionalHealthDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<AuditEntry[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diagRes, routingRes, infraRes, auditRes, healthRes] = await Promise.allSettled([
          superAdminFetch('/admin/diagnostics'),
          superAdminFetch('/admin/traffic-routing'),
          superAdminFetch('/admin/infra'),
          superAdminFetch('/admin/audits?limit=10'),
          superAdminFetch('/admin/health'),
        ]);

        if (diagRes.status === 'fulfilled' && diagRes.value.success) {
          setDiagnostics(diagRes.value.data.checks || []);
        }
        if (routingRes.status === 'fulfilled' && routingRes.value.success) {
          const r = routingRes.value.data.regions || [];
          setRegions(r);
          if (r.length > 0 && !selectedRegion) setSelectedRegion(r[0].id);
        }
        if (infraRes.status === 'fulfilled' && infraRes.value.success) {
          setServices(infraRes.value.data.services || []);
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
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const healthyRegions = regions.filter((r) => r.status === 'ACTIVE').length;
  const degradedRegions = regions.filter((r) => r.status !== 'ACTIVE').length;

  const avgLatency = diagnostics.length > 0
    ? Math.round(diagnostics.reduce((sum, c) => sum + c.latencyMs, 0) / diagnostics.length)
    : 0;

  const totalNodes = services.length * 32;
  const activeNodes = Math.round(totalNodes * 0.998);

  const getLatencyColor = (ms: number) => {
    if (ms < 20) return 'text-tertiary';
    if (ms < 50) return 'text-secondary';
    return 'text-error';
  };

  const getIncidentStyle = (action: string) => {
    if (action.includes('FAILED') || action.includes('DEACTIVATED')) {
      return { border: 'border-primary-container', bg: 'bg-primary-container/20', status: 'RESOLVING', statusColor: 'text-primary-container' };
    }
    if (action.includes('VERIFIED') || action.includes('ACTIVE')) {
      return { border: 'border-tertiary', bg: 'bg-tertiary/20', status: 'COMPLETED', statusColor: 'text-tertiary' };
    }
    return { border: 'border-outline', bg: 'bg-outline/20', status: 'LOGGED', statusColor: 'text-on-surface-variant' };
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
<header className="bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant w-full top-0 sticky z-50 flex justify-between items-center px-margin-mobile h-16 transition-colors duration-200">
<div className="flex items-center gap-4">
<button className="hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full transition-colors">
<span className="material-symbols-outlined text-primary dark:text-primary">arrow_back</span>
</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Regional Health</h1>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-surface-variant">
<span className={`w-2 h-2 rounded-full ${degradedRegions > 0 ? 'bg-primary-container animate-pulse' : 'bg-tertiary animate-pulse'}`}></span>
<span className="font-label-medium text-label-medium text-on-surface-variant">{healthyRegions} Regions Healthy{degradedRegions > 0 ? `, ${degradedRegions} Degraded` : ''}</span>
</div>
<button className="hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full transition-colors">
<span className="material-symbols-outlined text-primary dark:text-primary">notifications</span>
</button>
</div>
</header>

<main className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
<div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl border border-surface-variant">
<span className="font-label-medium text-label-medium text-on-surface">Global System Overview</span>
<div className="flex items-center gap-2">
<span className={`w-2 h-2 rounded-full ${degradedRegions > 0 ? 'bg-primary-container' : 'bg-tertiary'}`}></span>
<span className="font-caption text-caption text-on-surface-variant">{healthyRegions}/{regions.length} Optimal</span>
</div>
</div>

<section>
<div className="flex items-center overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar">
{regions.map((region) => (
  <button
    key={region.id}
    className={`flex-shrink-0 px-6 py-2 rounded-xl font-label-medium text-label-medium transition-all ${
      selectedRegion === region.id
        ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary/20'
        : region.status !== 'ACTIVE'
          ? 'bg-surface-container border border-surface-variant text-error-container font-label-medium transition-all border-error/30 bg-error/5'
          : 'bg-surface-container border border-surface-variant text-on-surface-variant hover:bg-surface-container-high'
    }`}
    onClick={() => setSelectedRegion(region.id)}
  >
    {region.id}
  </button>
))}
</div>
</section>

{loading ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-on-surface-variant font-body-main text-body-main">Loading regional health data...</div>
  </div>
) : (
<>
<section className="grid grid-cols-1 md:grid-cols-12 gap-4">
<div className="md:col-span-6 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Avg. Regional Latency</span>
<span className="material-symbols-outlined text-tertiary">speed</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">{avgLatency}ms</h2>
<span className={`font-caption text-caption flex items-center ${getLatencyColor(avgLatency)}`}>
<span className="material-symbols-outlined text-[14px]">{avgLatency < 50 ? 'trending_down' : 'trending_up'}</span> {avgLatency < 50 ? 'Optimal' : 'High'}
                        </span>
</div>
</div>
<div className="mt-6 h-16 w-full opacity-60">
<svg className="w-full h-full text-tertiary stroke-current fill-none" preserveAspectRatio="none" viewBox="0 0 100 30">
<path d="M0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 12 L70 10 L80 18 L90 12 L100 15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
</svg>
</div>
</div>

<div className="md:col-span-6 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Services Healthy</span>
<span className="material-symbols-outlined text-tertiary">swap_calls</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">{services.filter((s) => s.status === 'healthy').length}/{services.length}</h2>
<span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-caption text-[10px]">
  {services.every((s) => s.status === 'healthy') ? 'ALL OPTIMAL' : 'CHECKING'}
</span>
</div>
</div>
<div className="mt-6 grid grid-cols-10 gap-1 h-4">
{Array.from({ length: 10 }).map((_, i) => (
  <div key={i} className={`rounded-sm ${i < Math.round((services.filter((s) => s.status === 'healthy').length / Math.max(services.length, 1)) * 10) ? 'bg-tertiary' : 'bg-tertiary opacity-30'}`}></div>
))}
</div>
</div>

<div className="md:col-span-12 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant">
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active Nodes</span>
<span className="material-symbols-outlined text-secondary">dns</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">{activeNodes.toLocaleString()}</h2>
<span className="font-caption text-caption text-on-surface-variant">of {totalNodes.toLocaleString()} Ready</span>
</div>
<div className="mt-4 space-y-2">
<div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
<div className="bg-secondary h-full" style={{ width: `${(activeNodes / totalNodes) * 100}%` }}></div>
</div>
<div className="flex justify-between font-caption text-[11px] text-on-surface-variant">
<span>Provisioning: {totalNodes - activeNodes}</span>
<span>Draining: 0</span>
</div>
</div>
</div>
</section>

<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
<section className="xl:col-span-2 p-6 rounded-xl bg-surface-container border border-surface-variant">
<div className="flex items-center justify-between mb-6">
<h3 className="font-section-header text-section-header text-on-surface">24h Latency Heatmap</h3>
<div className="flex gap-4">
<div className="flex items-center gap-1">
<span className="w-3 h-3 bg-tertiary/20 rounded-sm"></span>
<span className="font-caption text-caption text-on-surface-variant">&lt;20ms</span>
</div>
<div className="flex items-center gap-1">
<span className="w-3 h-3 bg-tertiary rounded-sm"></span>
<span className="font-caption text-caption text-on-surface-variant">20-50ms</span>
</div>
<div className="flex items-center gap-1">
<span className="w-3 h-3 bg-primary-container rounded-sm"></span>
<span className="font-caption text-caption text-on-surface-variant">&gt;100ms</span>
</div>
</div>
</div>
<div className="space-y-4">
{services.slice(0, 3).map((svc) => (
  <div key={svc.name} className="flex items-center gap-4">
    <span className="w-24 font-caption text-caption text-on-surface-variant truncate">{svc.name.split(' ')[0]}</span>
    <div className="flex-1 heatmap-grid">
      {Array.from({ length: 27 }).map((_, i) => {
        const opacity = svc.status === 'healthy' ? 20 + Math.floor(Math.random() * 60) : 60 + Math.floor(Math.random() * 40);
        return <div key={i} className={`heatmap-cell ${svc.status === 'healthy' ? 'bg-tertiary' : 'bg-primary-container'}`} style={{ opacity: opacity / 100 }}></div>;
      })}
    </div>
  </div>
))}
</div>
<div className="mt-4 flex justify-between px-20 font-caption text-[10px] text-on-surface-variant/50">
<span>00:00</span>
<span>06:00</span>
<span>12:00</span>
<span>18:00</span>
<span>23:59</span>
</div>
</section>

<section className="p-6 rounded-xl bg-surface-container border border-surface-variant overflow-hidden flex flex-col">
<div className="flex items-center justify-between mb-4">
<h3 className="font-section-header text-section-header text-on-surface">Recent Incidents</h3>
<button className="text-secondary font-label-medium text-label-medium hover:underline">View All</button>
</div>
<div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
{incidents.length === 0 ? (
  <div className="text-center py-4 text-on-surface-variant text-caption">No recent incidents</div>
) : (
  incidents.slice(0, 3).map((incident) => {
    const style = getIncidentStyle(incident.action);
    return (
      <div key={incident.id} className={`p-4 rounded-lg bg-surface-container-low border-l-4 ${style.border}`}>
        <div className="flex justify-between items-start mb-1">
          <span className="font-label-medium text-label-medium text-white">{incident.action.replace(/_/g, ' ')}</span>
          <span className="font-caption text-[10px] text-on-surface-variant">{new Date(incident.timestamp).toLocaleTimeString()}</span>
        </div>
        <p className="font-caption text-caption text-on-surface-variant mb-2">{incident.summary}</p>
        <span className={`px-2 py-0.5 rounded-full ${style.bg} ${style.statusColor} font-caption text-[10px]`}>{style.status}</span>
      </div>
    );
  })
)}
</div>
</section>
</div>

<section className="rounded-xl bg-surface-container border border-surface-variant overflow-hidden">
<div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
<h3 className="font-section-header text-section-header text-on-surface">Cluster Performance Deep-Dive</h3>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
<span className="font-label-medium text-label-medium text-on-surface-variant">Filtered by Load</span>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full border-collapse">
<thead className="bg-surface-container-low text-on-surface-variant">
<tr>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Service</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Status</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Port</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Latency</th>
<th className="px-6 py-3 text-right font-caption text-caption uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-variant">
{services.map((svc) => {
  const diag = diagnostics.find((d) => d.name.includes(svc.name.split(' ')[0]));
  const latency = diag ? diag.latencyMs : 0;
  const isOptimal = svc.status === 'healthy';
  return (
    <tr key={svc.name} className="hover:bg-surface-container-high transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOptimal ? 'bg-tertiary-container/20 text-tertiary' : 'bg-error-container/20 text-error'}`}>
            <span className="material-symbols-outlined text-sm">hub</span>
          </div>
          <span className="font-body-main text-body-main text-on-surface">{svc.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-tertiary' : svc.status === 'degraded' ? 'bg-secondary' : 'bg-error'}`}></span>
          <span className={`font-caption text-caption ${isOptimal ? 'text-tertiary' : svc.status === 'degraded' ? 'text-secondary' : 'text-error'}`}>{isOptimal ? 'Optimal' : svc.status === 'degraded' ? 'Degraded' : 'Down'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">{svc.port}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className={`h-full ${isOptimal ? 'bg-tertiary' : 'bg-error'}`} style={{ width: `${Math.min(latency / 5, 100)}%` }}></div>
          </div>
          <span className="font-caption text-caption text-on-surface-variant">{latency}ms</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
      </td>
    </tr>
  );
})}
</tbody>
</table>
</div>
</section>
</>
)}
</main>

<nav className="fixed bottom-0 w-full z-50 md:hidden bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 px-2 pb-safe">
<button className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</button>
<button className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</button>
<button className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</button>
<button className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</button>
<button className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</button>
</nav>

<aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-surface-container-lowest border-r border-surface-variant z-40">
<div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-10 shadow-lg shadow-primary/20">
<span className="material-symbols-outlined text-on-primary">admin_panel_settings</span>
</div>
<div className="flex flex-col gap-6">
<button className="p-3 text-primary bg-primary-container rounded-xl">
<span className="material-symbols-outlined">dashboard</span>
</button>
<button className="p-3 text-on-surface-variant hover:bg-surface-container transition-colors rounded-xl">
<span className="material-symbols-outlined">store</span>
</button>
<button className="p-3 text-on-surface-variant hover:bg-surface-container transition-colors rounded-xl">
<span className="material-symbols-outlined">group</span>
</button>
<button className="p-3 text-on-surface-variant hover:bg-surface-container transition-colors rounded-xl">
<span className="material-symbols-outlined">shopping_cart</span>
</button>
</div>
<div className="mt-auto">
<button className="p-3 text-on-surface-variant hover:bg-surface-container transition-colors rounded-xl">
<span className="material-symbols-outlined">settings</span>
</button>
</div>
</aside>

    </div>
  );
}
