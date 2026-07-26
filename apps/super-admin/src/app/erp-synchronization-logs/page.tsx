"use client";

import React from 'react';

export default function ERPSynchronizationLogsPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary cursor-pointer">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">ERP Sync Logs</h1>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex items-center bg-surface-container-high rounded-full px-4 py-1.5 border border-outline-variant">
<span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
<input className="bg-transparent border-none focus:ring-0 text-body-compact text-on-surface placeholder-muted w-48" placeholder="Filter entities..." type="text"/>
</div>
<div className="w-8 h-8 rounded-full overflow-hidden border border-primary">
<img className="w-full h-full object-cover" data-alt="A professional high-contrast portrait of a technical system administrator with a focused expression, set against a dark background with subtle red and blue glowing data interface highlights. The aesthetic is modern corporate with sharp focus and cinematic lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4OmjmKpQB9DG-rdPKng_5bLNZrfUHpXxZCkpdhsq0POyit4u3C2Z4DaIe-dA9n580ZFXVfz04P1tMBBfsW2Y8xwrF-fpq_tZVhUrRdGlyOv400CzUQCZK942LuEB2hbAz-7jWKYEhHjNDVh7D9r9zF2cLP2-SzfM1xnr-AEkBCbWIbQ5R45Ul76eGmlJgvxaf9hcRyy0STmISS7WozlM87wkmLTSxxsFuKjiYhpVzvCubhF3EVa60Y-7eTo19L0fp-qIUiZAP3fFe"/>
</div>
</div>
</header>
<main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-lg">
{/*  Summary KPI Bento Grid  */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
{/*  Last Successful Sync  */}
<div className="bento-card p-md rounded-xl flex flex-col justify-between">
<div>
<span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Last Successful Sync
                    </span>
<h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">5 mins ago</h2>
</div>
<div className="mt-md flex items-center gap-2 text-tertiary text-caption font-caption">
<span className="material-symbols-outlined text-[14px]">history</span>
                    System healthy
                </div>
</div>
{/*  Total Objects Today  */}
<div className="bento-card p-md rounded-xl flex flex-col justify-between">
<div>
<span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">data_thresholding</span>
                        Total Objects Today
                    </span>
<h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">842,104</h2>
</div>
<div className="mt-md flex items-center gap-2 text-primary text-caption font-caption">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +12% from yesterday
                </div>
</div>
{/*  Current Queue Status  */}
<div className="bento-card p-md rounded-xl flex flex-col justify-between">
<div>
<span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">reorder</span>
                        Current Queue Status
                    </span>
<h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">14 Active</h2>
</div>
<div className="mt-md flex items-center gap-2 text-secondary text-caption font-caption">
<span className="material-symbols-outlined text-[14px]">pending</span>
                    Avg latency: 42ms
                </div>
</div>
</section>
{/*  Detailed Log Table  */}
<section className="bento-card rounded-xl overflow-hidden">
<div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
<h3 className="text-section-header font-section-header text-on-surface">Event Logs</h3>
<div className="flex gap-sm">
<button className="bg-surface-container-high hover:bg-surface-bright text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant flex items-center gap-2 text-caption font-caption transition-colors">
<span className="material-symbols-outlined text-[16px]">tune</span>
                        Filters
                    </button>
<button className="bg-surface-container-high hover:bg-surface-bright text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant flex items-center gap-2 text-caption font-caption transition-colors">
<span className="material-symbols-outlined text-[16px]">download</span>
                        Export
                    </button>
</div>
</div>
<div className="overflow-x-auto custom-scrollbar">
<table className="w-full text-left border-collapse min-w-[800px]">
<thead className="bg-surface-container-low border-b border-outline-variant">
<tr>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Timestamp</th>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Entity Type</th>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Object Count</th>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Hub/Region</th>
<th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant">
{/*  Log Entry: Success  */}
<tr className="hover:bg-surface-container-high transition-colors">
<td className="p-md font-body-compact text-body-compact text-on-surface">14:02:45</td>
<td className="p-md">
<span className="bg-tertiary/20 text-tertiary px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" >check_circle</span> Success
                                </span>
</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">Inventory</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">1,240</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">SE-Zone 4</td>
<td className="p-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">visibility</span>
</td>
</tr>
{/*  Log Entry: Failed  */}
<tr className="bg-error-container/5 hover:bg-error-container/10 transition-colors">
<td className="p-md font-body-compact text-body-compact text-on-surface">13:58:12</td>
<td className="p-md">
<span className="bg-error/20 text-error px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" >error</span> Failed
                                </span>
<p className="text-[10px] text-error mt-1 italic">Timeout: Gateway Error 504</p>
</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">Orders</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">412</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">EU-North-1</td>
<td className="p-md text-right">
<button className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-lg border border-primary/20 text-caption font-caption transition-all active:scale-95">Retry</button>
</td>
</tr>
{/*  Log Entry: In Progress  */}
<tr className="hover:bg-surface-container-high transition-colors">
<td className="p-md font-body-compact text-body-compact text-on-surface">13:55:01</td>
<td className="p-md">
<span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1 animate-pulse">
<span className="material-symbols-outlined text-[14px] animate-spin">sync</span> In Progress
                                </span>
</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">Vendors</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">88</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">US-West 2</td>
<td className="p-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-not-allowed">visibility</span>
</td>
</tr>
{/*  Log Entry: Success  */}
<tr className="hover:bg-surface-container-high transition-colors">
<td className="p-md font-body-compact text-body-compact text-on-surface">13:42:30</td>
<td className="p-md">
<span className="bg-tertiary/20 text-tertiary px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" >check_circle</span> Success
                                </span>
</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">Inventory</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">5,119</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">APAC-South</td>
<td className="p-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">visibility</span>
</td>
</tr>
{/*  Log Entry: Failed  */}
<tr className="bg-error-container/5 hover:bg-error-container/10 transition-colors">
<td className="p-md font-body-compact text-body-compact text-on-surface">13:30:15</td>
<td className="p-md">
<span className="bg-error/20 text-error px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" >report</span> Failed
                                </span>
<p className="text-[10px] text-error mt-1 italic">IO: Null Reference Exception</p>
</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">System Config</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">14</td>
<td className="p-md font-body-compact text-body-compact text-on-surface">Global</td>
<td className="p-md text-right">
<button className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-lg border border-primary/20 text-caption font-caption transition-all active:scale-95">Retry</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-caption font-caption text-on-surface-variant">
<span>Showing 5 of 1,284 entries</span>
<div className="flex gap-4">
<button className="hover:text-primary transition-colors">Previous</button>
<button className="text-on-surface font-bold">1</button>
<button className="hover:text-primary transition-colors">2</button>
<button className="hover:text-primary transition-colors">3</button>
<button className="hover:text-primary transition-colors">Next</button>
</div>
</div>
</section>
</main>
{/*  Floating Action Button  */}
<button className="fixed bottom-24 right-6 md:right-8 bg-primary text-on-primary-container p-4 rounded-xl shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all z-[60]">
<span className="material-symbols-outlined">sync</span>
<span className="font-label-medium text-label-medium font-bold pr-2">Manual Force Sync</span>
</button>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container dark:bg-surface-container border-t border-outline-variant dark:border-outline-variant flex justify-around items-center py-2 shadow-lg">
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary dark:hover:text-primary scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</a>
{/*  ACTIVE TAB: System  */}
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-fixed dark:text-on-primary-fixed rounded-xl px-3 py-1 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" >settings</span>
<span className="font-label-medium text-label-medium">System</span>
</a>
</nav>


    </div>
  );
}
