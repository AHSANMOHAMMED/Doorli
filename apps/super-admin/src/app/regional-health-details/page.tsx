"use client";

import React from 'react';

export default function RegionalHealthDetailsPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top App Bar (Shared Component)  */}
<header className="bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant w-full top-0 sticky z-50 flex justify-between items-center px-margin-mobile h-16 transition-colors duration-200">
<div className="flex items-center gap-4">
<button className="hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full transition-colors">
<span className="material-symbols-outlined text-primary dark:text-primary">arrow_back</span>
</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Regional Health</h1>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-surface-variant">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-medium text-label-medium text-on-surface-variant">3 Regions Healthy, 1 Degraded</span>
</div>
<button className="hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full transition-colors">
<span className="material-symbols-outlined text-primary dark:text-primary">notifications</span>
</button>
</div>
</header>
<main className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
{/*  Mobile Regional Status Indicator  */}
<div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl border border-surface-variant">
<span className="font-label-medium text-label-medium text-on-surface">Global System Overview</span>
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-caption text-caption text-on-surface-variant">3/4 Optimal</span>
</div>
</div>
{/*  Region Selector  */}
<section>
<div className="flex items-center overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar">
<button className="flex-shrink-0 px-6 py-2 rounded-xl bg-primary-container text-on-primary-container font-label-medium text-label-medium transition-all shadow-lg shadow-primary/20">
                    US-East
                </button>
<button className="flex-shrink-0 px-6 py-2 rounded-xl bg-surface-container border border-surface-variant text-on-surface-variant hover:bg-surface-container-high font-label-medium text-label-medium transition-all">
                    EU-Central
                </button>
<button className="flex-shrink-0 px-6 py-2 rounded-xl bg-surface-container border border-surface-variant text-on-surface-variant hover:bg-surface-container-high font-label-medium text-label-medium transition-all">
                    AP-South
                </button>
<button className="flex-shrink-0 px-6 py-2 rounded-xl bg-surface-container border border-surface-variant text-error-container text-error font-label-medium text-label-medium transition-all border-error/30 bg-error/5">
                    AP-Southeast
                </button>
</div>
</section>
{/*  Performance Overview (Bento Style)  */}
<section className="grid grid-cols-1 md:grid-cols-12 gap-4">
{/*  Latency Card  */}
<div className="md:col-span-6 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Avg. Regional Latency</span>
<span className="material-symbols-outlined text-tertiary">speed</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">42ms</h2>
<span className="font-caption text-caption text-tertiary flex items-center">
<span className="material-symbols-outlined text-[14px]">trending_down</span> 4%
                        </span>
</div>
</div>
<div className="mt-6 h-16 w-full opacity-60">
{/*  Simple Sparkline Placeholder  */}
<svg className="w-full h-full text-tertiary stroke-current fill-none" preserveAspectRatio="none" viewBox="0 0 100 30">
<path d="M0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 12 L70 10 L80 18 L90 12 L100 15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
</svg>
</div>
</div>
{/*  Packet Loss Card  */}
<div className="md:col-span-6 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant flex flex-col justify-between">
<div>
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Packet Loss %</span>
<span className="material-symbols-outlined text-tertiary">swap_calls</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">0.002%</h2>
<span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-caption text-[10px]">OPTIMAL</span>
</div>
</div>
<div className="mt-6 grid grid-cols-10 gap-1 h-4">
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm"></div>
<div className="bg-tertiary rounded-sm opacity-30"></div>
<div className="bg-tertiary rounded-sm opacity-30"></div>
<div className="bg-tertiary rounded-sm opacity-30"></div>
<div className="bg-tertiary rounded-sm opacity-30"></div>
</div>
</div>
{/*  Active Nodes Card  */}
<div className="md:col-span-12 lg:col-span-4 p-6 rounded-xl bg-surface-container border border-surface-variant">
<div className="flex justify-between items-start mb-4">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active Nodes</span>
<span className="material-symbols-outlined text-secondary">dns</span>
</div>
<div className="flex items-baseline gap-2">
<h2 className="font-kpi-number text-kpi-number text-white">1,248</h2>
<span className="font-caption text-caption text-on-surface-variant">of 1,250 Ready</span>
</div>
<div className="mt-4 space-y-2">
<div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
<div className="bg-secondary h-full" ></div>
</div>
<div className="flex justify-between font-caption text-[11px] text-on-surface-variant">
<span>Provisioning: 2</span>
<span>Draining: 0</span>
</div>
</div>
</div>
</section>
{/*  Latency Heatmap & Clusters Grid  */}
<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
{/*  Latency Heatmap  */}
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
{/*  Heatmap Rows  */}
<div className="flex items-center gap-4">
<span className="w-16 font-caption text-caption text-on-surface-variant">Cluster-α</span>
<div className="flex-1 heatmap-grid">
{/*  JS will ideally populate this, but for static UI:  */}
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/80"></div><div className="heatmap-cell bg-primary-container"></div><div className="heatmap-cell bg-tertiary/80"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/40"></div><div className="heatmap-cell bg-tertiary/50"></div><div className="heatmap-cell bg-tertiary/60"></div>
</div>
</div>
<div className="flex items-center gap-4">
<span className="w-16 font-caption text-caption text-on-surface-variant">Cluster-β</span>
<div className="flex-1 heatmap-grid">
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
<div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div><div className="heatmap-cell bg-tertiary/20"></div>
</div>
</div>
<div className="flex items-center gap-4">
<span className="w-16 font-caption text-caption text-on-surface-variant">Cluster-γ</span>
<div className="flex-1 heatmap-grid">
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
<div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div><div className="heatmap-cell bg-tertiary/60"></div>
</div>
</div>
</div>
<div className="mt-4 flex justify-between px-20 font-caption text-[10px] text-on-surface-variant/50">
<span>00:00</span>
<span>06:00</span>
<span>12:00</span>
<span>18:00</span>
<span>23:59</span>
</div>
</section>
{/*  Incident History  */}
<section className="p-6 rounded-xl bg-surface-container border border-surface-variant overflow-hidden flex flex-col">
<div className="flex items-center justify-between mb-4">
<h3 className="font-section-header text-section-header text-on-surface">Recent Incidents</h3>
<button className="text-secondary font-label-medium text-label-medium hover:underline">View All</button>
</div>
<div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
<div className="p-4 rounded-lg bg-surface-container-low border-l-4 border-primary-container">
<div className="flex justify-between items-start mb-1">
<span className="font-label-medium text-label-medium text-white">Spike in Cluster-α</span>
<span className="font-caption text-[10px] text-on-surface-variant">14m ago</span>
</div>
<p className="font-caption text-caption text-on-surface-variant mb-2">High CPU usage detected on Node 422. Auto-scaling initiated.</p>
<span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-caption text-[10px]">RESOLVING</span>
</div>
<div className="p-4 rounded-lg bg-surface-container-low border-l-4 border-tertiary">
<div className="flex justify-between items-start mb-1">
<span className="font-label-medium text-label-medium text-white">Patch Success</span>
<span className="font-caption text-[10px] text-on-surface-variant">2h ago</span>
</div>
<p className="font-caption text-caption text-on-surface-variant">Kernel update rolled out to 100% of US-East nodes.</p>
<span className="px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary font-caption text-[10px]">COMPLETED</span>
</div>
<div className="p-4 rounded-lg bg-surface-container-low border-l-4 border-outline">
<div className="flex justify-between items-start mb-1">
<span className="font-label-medium text-label-medium text-white">Config Change</span>
<span className="font-caption text-[10px] text-on-surface-variant">5h ago</span>
</div>
<p className="font-caption text-caption text-on-surface-variant">Traffic routing policy updated by system-admin-01.</p>
<span className="px-2 py-0.5 rounded-full bg-outline/20 text-on-surface-variant font-caption text-[10px]">LOGGED</span>
</div>
</div>
</section>
</div>
{/*  Cluster Status List  */}
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
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Cluster Name</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Status</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Uptime</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Load</th>
<th className="px-6 py-3 text-left font-caption text-caption uppercase tracking-wider">Nodes</th>
<th className="px-6 py-3 text-right font-caption text-caption uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-variant">
<tr className="hover:bg-surface-container-high transition-colors">
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-sm">hub</span>
</div>
<span className="font-body-main text-body-main text-on-surface">Alpha-01</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-caption text-caption text-tertiary">Optimal</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">99.98%</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-tertiary h-full" ></div>
</div>
<span className="font-caption text-caption text-on-surface-variant">62%</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">124</td>
<td className="px-6 py-4 whitespace-nowrap text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
</td>
</tr>
<tr className="hover:bg-surface-container-high transition-colors">
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined text-sm">hub</span>
</div>
<span className="font-body-main text-body-main text-on-surface">Beta-09</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
<span className="font-caption text-caption text-primary-container">Degraded</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">94.12%</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-primary-container h-full" ></div>
</div>
<span className="font-caption text-caption text-primary-container font-bold">94%</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">88</td>
<td className="px-6 py-4 whitespace-nowrap text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
</td>
</tr>
<tr className="hover:bg-surface-container-high transition-colors">
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-sm">hub</span>
</div>
<span className="font-body-main text-body-main text-on-surface">Gamma-12</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-caption text-caption text-tertiary">Optimal</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">99.99%</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-secondary h-full" ></div>
</div>
<span className="font-caption text-caption text-on-surface-variant">12%</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap font-body-compact text-body-compact text-on-surface-variant">256</td>
<td className="px-6 py-4 whitespace-nowrap text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-6 py-4 bg-surface-container-low flex justify-end">
<nav className="flex gap-2">
<button className="p-1 rounded-md border border-surface-variant hover:bg-surface-container text-on-surface-variant disabled:opacity-30" disabled={true}>
<span className="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button className="px-3 py-1 rounded-md bg-primary-container text-on-primary-container font-caption text-caption">1</button>
<button className="px-3 py-1 rounded-md hover:bg-surface-container text-on-surface-variant font-caption text-caption">2</button>
<button className="p-1 rounded-md border border-surface-variant hover:bg-surface-container text-on-surface-variant">
<span className="material-symbols-outlined text-sm">chevron_right</span>
</button>
</nav>
</div>
</section>
</main>
{/*  Bottom Nav Bar (Shared Component - Mobile Only)  */}
<nav className="fixed bottom-0 w-full z-50 md:hidden bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 px-2 pb-safe">
<button className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150">
<span className="material-symbols-outlined" >dashboard</span>
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
{/*  Side Nav (Desktop Logic Simulation)  */}
<aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 bg-surface-container-lowest border-r border-surface-variant z-40">
<div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-10 shadow-lg shadow-primary/20">
<span className="material-symbols-outlined text-on-primary">admin_panel_settings</span>
</div>
<div className="flex flex-col gap-6">
<button className="p-3 text-primary bg-primary-container rounded-xl">
<span className="material-symbols-outlined" >dashboard</span>
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
