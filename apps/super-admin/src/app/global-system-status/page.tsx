"use client";

import React from 'react';

export default function GlobalSystemStatusPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
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
<img className="w-full h-full object-cover" data-alt="A professional headshot of a high-level system administrator, lit with dramatic rim lighting in a futuristic server room. The aesthetic is clean, sharp, and focused, dominated by dark tones with hints of soft red and electric blue glows reflecting off glass surfaces. High-end professional portrait photography." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-V4NRJUFJXVTHZP-mOIfaaUKmfKeEx0qgZGs2BcEremU8GdXxcT0r6YC53rgKlyYlRXXXtpYx65H0WUo5j7qTPCKGtLhViAxns2J5ix_zSdKN4b9g9dzkIeLR0EuqR-Mq_DUQkwKYZ883Dl9Qc2QkU7fURzgDFPWMWA8tmzIZecngwsA_aYMwriUJge38icvw1qpT0sptUXvNSLG-R-vaQuCZmRg9J4wZmBOosp0IMzVWMo0Wam1foAIA7SnYnWiGmoFiyxcfM4XA"/>
</div>
</div>
</header>
{/*  Sidebar / NavigationDrawer (Desktop Only)  */}
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
<span className="text-tertiary">STABLE</span>
</div>
<div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full w-[94%] bg-tertiary"></div>
</div>
</div>
</aside>
{/*  Main Content  */}
<main className="pt-20 pb-24 md:pl-72 md:pr-12 px-margin-mobile min-h-screen technical-grid">
{/*  Overall Status Header  */}
<section className="mb-xl flex flex-col md:flex-row md:items-center justify-between gap-md">
<div>
<div className="flex items-center gap-sm mb-xs">
<div className="w-3 h-3 bg-tertiary rounded-full glow-pulse"></div>
<span className="font-section-header text-section-header text-tertiary uppercase tracking-wider">System Operational</span>
</div>
<h2 className="font-screen-title text-screen-title text-on-background">Global Node Infrastructure</h2>
</div>
<div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex items-center gap-lg">
<div>
<span className="font-caption text-caption text-on-surface-variant block uppercase">Aggregated Uptime</span>
<span className="font-kpi-number text-kpi-number text-tertiary">99.99<span className="text-label-medium">%</span></span>
</div>
<div className="w-[1px] h-10 bg-outline-variant"></div>
<div>
<span className="font-caption text-caption text-on-surface-variant block uppercase">MTTR</span>
<span className="font-kpi-number text-kpi-number text-on-surface">14<span className="text-label-medium">m</span></span>
</div>
</div>
</section>
{/*  Bento Layout  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
{/*  Map Visualization  */}
<div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md h-[400px] relative overflow-hidden group">
<div className="absolute top-md left-md z-10 flex flex-col gap-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant flex items-center gap-xs">
<span className="material-symbols-outlined text-[16px]">public</span>
                        Global Distribution
                    </span>
<span className="font-caption text-caption text-tertiary">142 Nodes Active</span>
</div>
<div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none" data-location="World Map" >
<img className="w-full h-full object-cover" data-alt="A stylized vector world map in high-density technical blueprint style. The oceans are deep charcoal and continents are outlined in dark gray. Glowing green, yellow, and red data points are scattered across major global hubs, interconnected by thin light trails representing data flow. Cinematic command center aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKNDyT8H2nbZER115jbihHgvuli5M7a4-sxrEUsWN-ovgzXX6o3nvLCoXbSwTtghNlLWWMXC8XNhrorYUP3l8KtVEKyfv0P5MF5DmXjL81CsTqU44CHsLpYWDuRZ8mI9dt34dumkqQRHEmq42ErLNskNf6gSvtLcR3DwngwJGF-0S4-kdcY1Mfiv0cahtzbeAMbSr_u0n8wpboROKb-wSWx5UDkUTYT1s_-SNNg4UGoP69vmvovgGvwi5SwmEUiDvGdW75maLonNqv"/>
</div>
{/*  Interactive Markers Overlay  */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
<div className="absolute top-1/3 left-1/4 w-4 h-4 bg-tertiary rounded-full shadow-[0_0_15px_rgba(111,216,200,0.6)] animate-ping"></div>
<div className="absolute top-1/4 right-1/4 w-4 h-4 bg-tertiary rounded-full shadow-[0_0_15px_rgba(111,216,200,0.6)]"></div>
<div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-error rounded-full shadow-[0_0_15px_rgba(255,83,91,0.6)] animate-pulse"></div>
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
{/*  KPI Grid (Nested in Bento)  */}
<div className="lg:col-span-4 flex flex-col gap-gutter">
<div className="grid grid-cols-2 gap-gutter h-full">
{/*  Active Sessions  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-primary">groups</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Active Sessions</span>
<div className="font-kpi-number text-kpi-number text-on-surface">2,450</div>
</div>
</div>
{/*  Global Latency  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-secondary">speed</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Avg Latency</span>
<div className="font-kpi-number text-kpi-number text-on-surface">42<span className="text-label-medium">ms</span></div>
</div>
</div>
{/*  Error Rate  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-error">warning</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">Error Rate</span>
<div className="font-kpi-number text-kpi-number text-on-surface">0.04<span className="text-label-medium">%</span></div>
</div>
</div>
{/*  ERP Sync Status  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined text-tertiary">sync</span>
<div>
<span className="font-caption text-caption text-on-surface-variant uppercase">ERP Sync</span>
<div className="font-body-main text-body-main text-tertiary font-bold mt-sm">SYNCED 2m ago</div>
</div>
</div>
</div>
</div>
{/*  Regional Performance List  */}
<div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header mb-md flex items-center justify-between">
                    Regional Performance
                    <span className="material-symbols-outlined text-on-surface-variant">sort</span>
</h3>
<div className="space-y-sm">
{/*  US-East  */}
<div className="p-sm bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
<div className="flex flex-col">
<span className="font-label-medium text-label-medium text-on-surface">US-East (N. Virginia)</span>
<span className="font-caption text-caption text-on-surface-variant">Cluster: Alpha-01</span>
</div>
<div className="flex items-center gap-lg">
<div className="hidden sm:flex flex-col items-end">
<span className="font-caption text-caption text-tertiary">12ms latency</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full w-1/4 bg-tertiary"></div>
</div>
</div>
<span className="material-symbols-outlined text-tertiary">check_circle</span>
</div>
</div>
{/*  EU-Central  */}
<div className="p-sm bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
<div className="flex flex-col">
<span className="font-label-medium text-label-medium text-on-surface">EU-Central (Frankfurt)</span>
<span className="font-caption text-caption text-on-surface-variant">Cluster: Beta-09</span>
</div>
<div className="flex items-center gap-lg">
<div className="hidden sm:flex flex-col items-end">
<span className="font-caption text-caption text-secondary">58ms latency</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full w-3/4 bg-secondary"></div>
</div>
</div>
<span className="material-symbols-outlined text-secondary">trending_up</span>
</div>
</div>
{/*  AP-South  */}
<div className="p-sm bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
<div className="flex flex-col">
<span className="font-label-medium text-label-medium text-on-surface">AP-South (Mumbai)</span>
<span className="font-caption text-caption text-on-surface-variant">Cluster: Delta-04</span>
</div>
<div className="flex items-center gap-lg">
<div className="hidden sm:flex flex-col items-end">
<span className="font-caption text-caption text-error">142ms latency</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full w-[95%] bg-error"></div>
</div>
</div>
<span className="material-symbols-outlined text-error">report_problem</span>
</div>
</div>
</div>
</div>
{/*  Critical Incident Feed  */}
<div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header mb-md flex items-center justify-between">
                    Incident Feed
                    <span className="text-caption font-caption text-primary cursor-pointer hover:underline">View All</span>
</h3>
<div className="space-y-sm">
{/*  Incident 1  */}
<div className="flex gap-md p-sm bg-error-container/10 border-l-4 border-error rounded-r-lg">
<div className="shrink-0 pt-xs">
<span className="material-symbols-outlined text-error">priority_high</span>
</div>
<div>
<div className="flex items-center gap-sm mb-xs">
<span className="font-label-medium text-label-medium text-error font-bold">CRITICAL</span>
<span className="font-caption text-caption text-on-surface-variant">14:22 UTC</span>
</div>
<p className="font-body-compact text-body-compact text-on-surface mb-xs">Database replication lag exceeding 5s in AP-South-1 region.</p>
<span className="font-caption text-caption text-on-surface-variant">Assigned to: DB-Reliability-Team</span>
</div>
</div>
{/*  Incident 2  */}
<div className="flex gap-md p-sm bg-secondary-container/10 border-l-4 border-secondary rounded-r-lg">
<div className="shrink-0 pt-xs">
<span className="material-symbols-outlined text-secondary">info</span>
</div>
<div>
<div className="flex items-center gap-sm mb-xs">
<span className="font-label-medium text-label-medium text-secondary font-bold">INFO</span>
<span className="font-caption text-caption text-on-surface-variant">13:05 UTC</span>
</div>
<p className="font-body-compact text-body-compact text-on-surface mb-xs">Automated ERP sync completed with 4 warnings. Manual review suggested.</p>
<button className="text-secondary font-caption text-caption uppercase font-bold hover:underline">View Report</button>
</div>
</div>
{/*  Incident 3  */}
<div className="flex gap-md p-sm bg-surface-container-highest/20 border-l-4 border-outline rounded-r-lg">
<div className="shrink-0 pt-xs">
<span className="material-symbols-outlined text-outline">history</span>
</div>
<div>
<div className="flex items-center gap-sm mb-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant font-bold">RESOLVED</span>
<span className="font-caption text-caption text-on-surface-variant">10:45 UTC</span>
</div>
<p className="font-body-compact text-body-compact text-on-surface-variant line-through">Inbound traffic spike mitigated via auto-scaling in US-East-1.</p>
</div>
</div>
</div>
</div>
</div>
</main>
{/*  FAB Action Button  */}
<button className="fixed bottom-24 right-margin-mobile md:bottom-12 md:right-12 bg-primary-container text-on-primary-fixed hover:bg-primary transition-all duration-300 flex items-center gap-md px-lg py-md rounded-xl shadow-xl z-50 group" onClick={() => {}}>
<span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">settings_backup_restore</span>
<span className="font-label-medium text-label-medium font-bold uppercase tracking-widest">Run Diagnostics</span>
</button>
{/*  BottomNavBar (Mobile Only)  */}
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
{/*  Micro-interaction Script  */}


    </div>
  );
}
