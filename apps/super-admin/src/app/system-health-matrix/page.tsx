"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function SystemHealthMatrixPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminFetch('/admin/infra').then((res) => {
      if (res.success) {
        setServices(res.data.services);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 w-full bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary dark:text-primary">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" data-alt="A cinematic, high-resolution portrait of a professional system administrator in a dark, tech-focused environment. The lighting is dramatic, with cool blue and sharp red rim lights reflecting off server rack glass. The style is modern, technical, and authoritative, matching a high-stakes command center aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlodN9gurf8expJ9UZh4oHI4Q_1zyGvKUsRe1qN-X35MtOUP2qGOsrC5ROrrDTVHOQ7nNBFnEBU27U6HLdSIW7_LoaF1ympgLL8EuQTns3TiKv6BBBKL_LvHNGL1lyNCJDovMeATKi0Fy2D0cKEwSSJEOzJ2AGHZ6uaxwzzZJx17bHv9qvEMJ_25RQn9OL697AmLM5ub5wQyhF10TEAHQyzmtNtg3e7TK3jihVdIPK-cqh5GN7qpkuBUnluP3HD4U7LvWPC8H-IwuF"/>
</div>
</div>
</header>
{/*  Main Content Area  */}
<main className="pt-16 pb-24 min-h-screen matrix-grid-bg">
<div className="max-w-screen-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
{/*  High-Level Status  */}
<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl shadow-xl">
<div className="flex items-center gap-md">
<div className="relative">
<div className="w-4 h-4 rounded-full bg-tertiary pulse-green"></div>
<div className="absolute -inset-1 rounded-full border border-tertiary opacity-20"></div>
</div>
<div>
<h2 className="font-section-header text-section-header">All Systems Operational</h2>
<p className="font-caption text-caption text-on-surface-variant">Uptime: 99.998% • Last check: Just now</p>
</div>
</div>
<div className="mt-md md:mt-0 flex gap-sm">
<div className="px-sm py-xs bg-tertiary/10 text-tertiary rounded-lg font-label-medium text-label-medium border border-tertiary/20">Production: Stable</div>
<div className="px-sm py-xs bg-secondary/10 text-secondary rounded-lg font-label-medium text-label-medium border border-secondary/20">v2.4.0-Stable</div>
</div>
</div>
{/*  Metrics Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
{/*  API Success Rate  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">API Success Rate</span>
<span className="material-symbols-outlined text-tertiary text-sm">trending_up</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">99.98%</div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-tertiary w-[99.98%]"></div>
</div>
</div>
{/*  CPU Load  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">CPU Load</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">memory</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">14%</div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-secondary w-[14%]"></div>
</div>
</div>
{/*  Memory Usage  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">Memory Usage</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">database</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">3.2<span className="text-lg font-medium opacity-60">/8GB</span></div>
<div className="mt-base h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container w-[40%]"></div>
</div>
</div>
{/*  Active WebSockets  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl hover:bg-surface-container-high transition-colors">
<div className="flex justify-between items-start mb-sm">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active WebSockets</span>
<span className="material-symbols-outlined text-on-surface-variant text-sm">swap_calls</span>
</div>
<div className="font-kpi-number text-kpi-number text-on-surface">1,248</div>
<div className="mt-base flex items-center gap-xs text-tertiary font-caption text-caption">
<span className="material-symbols-outlined text-sm">arrow_upward</span> 12% vs last hour
                    </div>
</div>
</div>
{/*  Regional Health & Service Status  */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
{/*  Regional Health  */}
<section className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col h-full">
<div className="flex items-center justify-between mb-lg">
<h3 className="font-section-header text-section-header flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">public</span>
                            Regional Health
                        </h3>
<span className="text-caption font-caption text-on-surface-variant">AWS Infrastructure</span>
</div>
<div className="space-y-sm overflow-y-auto">
<div className="flex items-center justify-between p-sm bg-background border border-outline-variant rounded-lg">
<div className="flex items-center gap-md">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-body-compact text-body-compact">US-East-1 (N. Virginia)</span>
</div>
<div className="flex items-center gap-lg">
<span className="font-caption text-caption text-on-surface-variant">24ms</span>
<span className="text-tertiary font-label-medium text-label-medium">Healthy</span>
</div>
</div>
<div className="flex items-center justify-between p-sm bg-background border border-outline-variant rounded-lg">
<div className="flex items-center gap-md">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-body-compact text-body-compact">EU-Central-1 (Frankfurt)</span>
</div>
<div className="flex items-center gap-lg">
<span className="font-caption text-caption text-on-surface-variant">48ms</span>
<span className="text-tertiary font-label-medium text-label-medium">Healthy</span>
</div>
</div>
<div className="flex items-center justify-between p-sm bg-background border border-outline-variant rounded-lg">
<div className="flex items-center gap-md">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span className="font-body-compact text-body-compact">AP-Southeast-1 (Singapore)</span>
</div>
<div className="flex items-center gap-lg">
<span className="font-caption text-caption text-on-surface-variant">156ms</span>
<span className="text-primary-container font-label-medium text-label-medium">Degraded</span>
</div>
</div>
</div>
</section>
{/*  Service Status  */}
<section className="bg-surface-container border border-outline-variant rounded-xl p-md">
<div className="flex items-center justify-between mb-lg">
<h3 className="font-section-header text-section-header flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">hub</span>
                            Service Status
                        </h3>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
{loading ? (
  <div className="col-span-2 text-center py-4 text-on-surface-variant text-caption">Loading service status...</div>
) : (
  services.map((svc) => (
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
  ))
)}
</div>
</section>
</div>
{/*  Incident History  */}
<section className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header flex items-center gap-sm mb-lg">
<span className="material-symbols-outlined text-primary">history</span>
                    Incident History
                </h3>
<div className="space-y-md">
{/*  Event 1  */}
<div className="relative pl-lg border-l-2 border-outline-variant pb-md last:pb-0">
<div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-tertiary-container border-4 border-background"></div>
<div className="flex flex-col md:flex-row md:items-center justify-between gap-base">
<span className="font-body-compact font-bold text-on-surface">Database Optimization Completed</span>
<span className="font-caption text-caption text-on-surface-variant">Today, 04:00 AM</span>
</div>
<p className="font-body-compact text-on-surface-variant mt-base">Scheduled maintenance for shard re-indexing was completed successfully across all nodes.</p>
</div>
{/*  Event 2  */}
<div className="relative pl-lg border-l-2 border-outline-variant pb-md last:pb-0">
<div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-container border-4 border-background"></div>
<div className="flex flex-col md:flex-row md:items-center justify-between gap-base">
<span className="font-body-compact font-bold text-on-surface">AP-Southeast-1 Latency Spike</span>
<span className="font-caption text-caption text-on-surface-variant">Yesterday, 11:24 PM</span>
</div>
<p className="font-body-compact text-on-surface-variant mt-base">Resolved: Upstream provider routing issue caused transient latency. Auto-failover initiated.</p>
</div>
</div>
</section>
{/*  Bottom Action  */}
<div className="pt-md pb-base">
<button className="w-full bg-primary-container text-on-primary-container h-14 rounded-xl font-section-header flex items-center justify-center gap-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20">
<span className="material-symbols-outlined">health_metrics</span>
                    Run Full System Diagnostics
                </button>
</div>
</div>
</main>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container border-t border-outline-variant dark:border-outline-variant z-50 shadow-lg">
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-fixed dark:text-on-primary-fixed rounded-xl px-3 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined" >health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</a>
</nav>


    </div>
  );
}
