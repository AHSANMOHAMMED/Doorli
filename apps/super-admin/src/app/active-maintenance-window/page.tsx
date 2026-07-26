"use client";

import React from 'react';

export default function ActiveMaintenanceWindowPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top Warning Banner  */}
<div className="h-10 bg-error-container text-on-error-container flex items-center justify-center px-margin-desktop z-[60] fixed top-0 w-full overflow-hidden">
<div className="flex items-center gap-2 animate-pulse">
<span className="material-symbols-outlined text-[18px]">warning</span>
<span className="font-label-medium text-label-medium uppercase tracking-wider">Maintenance Active — System Read-Only Mode</span>
</div>
<div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
</div>
{/*  TopAppBar  */}
<header className="fixed top-10 w-full bg-surface text-primary font-screen-title text-screen-title border-b border-outline-variant flex items-center justify-between px-margin-desktop h-16 z-50">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
<span className="material-symbols-outlined">shield_person</span>
</div>
<span className="font-screen-title text-screen-title font-bold text-primary">Doorli Admin</span>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex gap-6 items-center mr-8">
<span className="text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 px-3 py-1 rounded-lg cursor-pointer font-label-medium text-label-medium">Logs</span>
<span className="text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 px-3 py-1 rounded-lg cursor-pointer font-label-medium text-label-medium">Terminal</span>
<span className="text-primary font-bold transition-colors duration-200 px-3 py-1 rounded-lg cursor-pointer font-label-medium text-label-medium">System Status</span>
</div>
<button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">settings</button>
</div>
</header>
<main className="pt-32 pb-24 px-4 md:px-margin-desktop max-w-[1440px] mx-auto min-h-screen">
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  Main Progress Card  */}
<div className="md:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
<div className="absolute top-0 left-0 w-full h-1 bg-surface-container-high">
<div className="h-full bg-doorli-red transition-all duration-1000" id="top-progress-bar" ></div>
</div>
<div className="relative flex items-center justify-center mb-8">
<svg className="w-64 h-64">
<circle className="text-surface-container-highest stroke-current" cx="128" cy="128" fill="transparent" r="110" strokeWidth="12"></circle>
<circle className="text-doorli-red stroke-current progress-ring-circle" cx="128" cy="128" fill="transparent" id="main-progress-ring" r="110" strokeLinecap="round" strokeWidth="12" ></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-kpi-number text-kpi-number text-white" id="main-percent">68%</span>
<span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">Global Completion</span>
</div>
</div>
<div className="text-center">
<h2 className="font-section-header text-section-header text-white mb-2">Cluster Migration Phase 3</h2>
<p className="font-body-compact text-body-compact text-on-surface-variant max-w-md">Synchronizing 42/64 database shards across US-EAST regions. Latency optimized, no packet loss detected.</p>
</div>
<div className="mt-8 flex gap-4">
<div className="px-4 py-2 bg-surface-container-high rounded-lg border border-outline-variant flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
<span className="font-label-medium text-label-medium text-tertiary">EST. REMAINING: 14m 22s</span>
</div>
</div>
</div>
{/*  Task Checklist  */}
<div className="md:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6">
<h3 className="font-section-header text-section-header text-white mb-6 flex items-center justify-between">
                    Task Checklist
                    <span className="font-caption text-caption text-on-surface-variant">4/7 Tasks Done</span>
</h3>
<div className="space-y-4">
{/*  Task Item  */}
<div className="flex items-center justify-between p-3 bg-surface-container-high/50 border border-outline-variant/30 rounded-lg">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-tertiary" >check_circle</span>
<span className="font-body-compact text-body-compact text-on-surface">API Gateway Lock</span>
</div>
<span className="font-caption text-caption text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">ACTIVE</span>
</div>
{/*  Task Item  */}
<div className="flex items-center justify-between p-3 bg-surface-container-high/50 border border-outline-variant/30 rounded-lg">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-tertiary" >check_circle</span>
<span className="font-body-compact text-body-compact text-on-surface">Memory Buffer Flush</span>
</div>
<span className="font-caption text-caption text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">100%</span>
</div>
{/*  Task Item  */}
<div className="flex items-center justify-between p-3 bg-surface-container-high border border-primary/20 rounded-lg ring-1 ring-primary/30">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary animate-spin">refresh</span>
<span className="font-body-compact text-body-compact text-white">Database Shard Vacuuming</span>
</div>
<span className="font-caption text-caption text-primary">45%</span>
</div>
{/*  Task Item  */}
<div className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/20 rounded-lg opacity-60">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
<span className="font-body-compact text-body-compact text-on-surface-variant">Cache Re-validation</span>
</div>
<span className="font-caption text-caption text-on-surface-variant">PENDING</span>
</div>
{/*  Task Item  */}
<div className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/20 rounded-lg opacity-60">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
<span className="font-body-compact text-body-compact text-on-surface-variant">Load Balancer Unlock</span>
</div>
<span className="font-caption text-caption text-on-surface-variant">WAITING</span>
</div>
</div>
</div>
{/*  Safety Controls  */}
<div className="md:col-span-4 bg-surface-container-high border border-error-container rounded-xl p-6 flex flex-col justify-between">
<div>
<h3 className="font-section-header text-section-header text-error mb-2 flex items-center gap-2">
<span className="material-symbols-outlined">emergency_home</span> Safety Controls
                    </h3>
<p className="font-body-compact text-body-compact text-on-surface-variant mb-6">
                        Immediate cessation of all maintenance scripts and instant rollback to Snapshot: <code className="bg-black/30 px-1 rounded">2023-11-24-0400</code>.
                    </p>
</div>
<div className="space-y-3">
<button className="w-full h-12 bg-doorli-red hover:bg-inverse-primary text-white font-label-medium text-label-medium rounded-xl transition-all flex items-center justify-center gap-2 group">
<span className="material-symbols-outlined group-hover:scale-110 transition-transform">cancel</span>
                        ABORT &amp; ROLLBACK
                    </button>
<button className="w-full h-12 border border-outline text-on-surface hover:bg-surface-container-highest font-label-medium text-label-medium rounded-xl transition-all">
                        Pause Operation
                    </button>
</div>
</div>
{/*  Real-time System Logs  */}
<div className="md:col-span-8 bg-black border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[300px]">
<div className="bg-surface-container px-4 py-2 border-b border-outline-variant flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="flex gap-1.5">
<div className="w-3 h-3 rounded-full bg-error-container"></div>
<div className="w-3 h-3 rounded-full bg-secondary-container"></div>
<div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
</div>
<span className="font-caption text-caption text-on-surface-variant font-mono">system_worker_01.log</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant text-[18px]">terminal</span>
</div>
<div className="p-4 font-mono text-[12px] leading-relaxed text-tertiary/80 overflow-y-auto max-h-[250px] scroll-smooth" id="log-container">
<div className="mb-1"><span className="text-on-surface-variant">[04:12:01]</span> <span className="text-secondary">INF</span> Shard mapping initiated...</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:12:05]</span> <span className="text-secondary">INF</span> Connected to node-af-09-west</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:12:06]</span> <span className="text-tertiary">SUC</span> Node lock acquired.</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:12:10]</span> <span className="text-primary">WRN</span> Heavy I/O detected on shard-cluster-04</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:12:12]</span> <span className="text-secondary">INF</span> Auto-scaling worker group 'delta-5'</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:13:01]</span> <span className="text-secondary">INF</span> Phase 3 validation: 45% coverage</div>
<div className="mb-1"><span className="text-on-surface-variant">[04:13:05]</span> <span className="text-secondary">INF</span> Buffering writes to transient store</div>
</div>
</div>
</div>
</main>
{/*  BottomNavBar  */}
<nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container border-t border-outline-variant shadow-sm">
<div className="flex flex-col items-center justify-center text-on-surface-variant font-label-medium text-label-medium hover:bg-surface-variant transition-transform scale-95 active:scale-90 p-2">
<span className="material-symbols-outlined">dashboard</span>
<span>Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant font-label-medium text-label-medium hover:bg-surface-variant transition-transform scale-95 active:scale-90 p-2">
<span className="material-symbols-outlined">storefront</span>
<span>Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant font-label-medium text-label-medium hover:bg-surface-variant transition-transform scale-95 active:scale-90 p-2">
<span className="material-symbols-outlined">shopping_cart</span>
<span>Orders</span>
</div>
<div className="flex flex-col items-center justify-center text-primary font-bold font-label-medium text-label-medium hover:bg-surface-variant transition-transform scale-95 active:scale-90 p-2">
<span className="material-symbols-outlined">monitor_heart</span>
<span>Health</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant font-label-medium text-label-medium hover:bg-surface-variant transition-transform scale-95 active:scale-90 p-2">
<span className="material-symbols-outlined">settings_input_component</span>
<span>System</span>
</div>
</nav>


    </div>
  );
}
