"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function TrafficReroutingControlsPage() {

  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    superAdminFetch('/admin/traffic-routing').then(res => {
      if (res.success) {
        setRegions(res.data.regions || []);
      }
      setLoading(false);
    });
  }, []);

  const handleApply = async () => {
    setApplying(true);
    // Simulate apply
    await new Promise(r => setTimeout(r, 800));
    alert('Traffic routing changes applied successfully');
    setApplying(false);
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="w-full top-0 sticky bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full z-50">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary" data-icon="traffic">traffic</span>
<h1 className="font-screen-title text-screen-title-mobile md:text-screen-title font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex items-center px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant">
<span className="w-2 h-2 rounded-full bg-tertiary mr-2 animate-pulse"></span>
<span className="font-caption text-on-surface-variant">System: Optimal</span>
</div>
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">AP</div>
</div>
</header>
<main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg">
{/*  Regional Context Switcher  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-xl">
<div>
<h2 className="font-section-header text-section-header mb-1 text-on-surface">Traffic Control Center</h2>
<p className="font-caption text-on-surface-variant">Manage global distribution and failover protocols.</p>
</div>
<div className="flex p-1 bg-surface-container-low border border-outline-variant rounded-xl self-start md:self-auto">
<button className="px-6 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-medium transition-all">US-East</button>
<button className="px-6 py-2 rounded-lg text-on-surface-variant font-label-medium hover:bg-surface-bright transition-all">EU-Central</button>
<button className="px-6 py-2 rounded-lg text-on-surface-variant font-label-medium hover:bg-surface-bright transition-all">AP-South</button>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  Live Visualizer & Active Distribution (Bento Grid Style)  */}
<div className="md:col-span-8 flex flex-col gap-gutter">
{/*  Live Visualizer  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md h-80 relative overflow-hidden">
<div className="flex items-center justify-between mb-md relative z-10">
<h3 className="font-section-header text-section-header flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary" data-icon="hub">hub</span>
                            Live Traffic Topology
                        </h3>
<span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-caption uppercase tracking-wider">Real-time</span>
</div>
{/*  SVG Flow Diagram  */}
<div className="absolute inset-0 flex items-center justify-center p-xl">
<svg className="w-full h-full max-w-2xl" fill="none" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
{/*  Nodes  */}
<circle cx="100" cy="200" fill="#ffb3b1" r="10"></circle> {/*  Source  */}
<text className="font-caption" fill="#e5e2e1" font-size="12" x="80" y="235">Global Ingress</text>
<rect fill="#1c1b1b" height="60" rx="8" stroke="#333" width="120" x="350" y="50"></rect> {/*  US East  */}
<text className="font-label-medium" fill="#e5e2e1" font-size="14" x="375" y="85">US-EAST</text>
<rect fill="#1c1b1b" height="60" rx="8" stroke="#333" width="120" x="350" y="170"></rect> {/*  EU Central  */}
<text className="font-label-medium" fill="#e5e2e1" font-size="14" x="370" y="205">EU-CENTRAL</text>
<rect fill="#1c1b1b" height="60" rx="8" stroke="#333" width="120" x="350" y="290"></rect> {/*  AP South  */}
<text className="font-label-medium" fill="#e5e2e1" font-size="14" x="375" y="325">AP-SOUTH</text>
<circle cx="700" cy="200" fill="#6fd8c8" r="10"></circle> {/*  Destinations  */}
<text className="font-caption" fill="#e5e2e1" font-size="12" x="680" y="235">Core Database</text>
{/*  Flow Lines  */}
<path className="flow-line opacity-50" d="M110 200 C 200 200, 250 80, 350 80" stroke="#ffb3b1" strokeWidth="2"></path>
<path className="flow-line" d="M110 200 C 200 200, 250 200, 350 200" stroke="#ffb3b1" strokeWidth="4"></path>
<path className="flow-line opacity-30" d="M110 200 C 200 200, 250 320, 350 320" stroke="#ffb3b1" strokeWidth="2"></path>
<path d="M470 80 C 550 80, 600 200, 690 200" fill="none" opacity="0.4" stroke="#6fd8c8" strokeWidth="2"></path>
<path d="M470 200 C 550 200, 600 200, 690 200" fill="none" opacity="0.6" stroke="#6fd8c8" strokeWidth="4"></path>
<path d="M470 320 C 550 320, 600 200, 690 200" fill="none" opacity="0.4" stroke="#6fd8c8" strokeWidth="2"></path>
</svg>
</div>
</div>
{/*  Active Traffic Distribution  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md">
<div className="flex items-center justify-between mb-lg">
<h3 className="font-section-header text-section-header flex items-center gap-2">
<span className="material-symbols-outlined text-primary" data-icon="analytics">analytics</span>
                            Regional Load Balancing
                        </h3>
<div className="flex items-center gap-2">
<span className="font-caption text-on-surface-variant">Lock Ratios</span>
<button className="w-8 h-4 rounded-full bg-outline-variant relative flex items-center px-0.5">
<div className="w-3 h-3 rounded-full bg-on-surface"></div>
</button>
</div>
</div>
<div className="space-y-xl">
{/*  Cluster Alpha  */}
<div className="space-y-sm">
<div className="flex justify-between items-center">
<span className="font-label-medium text-on-surface">Cluster-Alpha (Primary)</span>
<span className="font-kpi-number text-primary text-[20px]">45%</span>
</div>
<input className="w-full" type="range" value="45"/>
</div>
{/*  Cluster Beta  */}
<div className="space-y-sm">
<div className="flex justify-between items-center">
<span className="font-label-medium text-on-surface">Cluster-Beta (Secondary)</span>
<span className="font-kpi-number text-primary text-[20px]">30%</span>
</div>
<input className="w-full" type="range" value="30"/>
</div>
{/*  Cluster Gamma  */}
<div className="space-y-sm">
<div className="flex justify-between items-center">
<span className="font-label-medium text-on-surface">Cluster-Gamma (Burst)</span>
<span className="font-kpi-number text-primary text-[20px]">25%</span>
</div>
<input className="w-full" type="range" value="25"/>
</div>
</div>
</div>
</div>
{/*  Sidebar Controls: Failover & Surgical Rules  */}
<div className="md:col-span-4 flex flex-col gap-gutter">
{/*  Failover Configuration  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header mb-md flex items-center gap-2">
<span className="material-symbols-outlined text-doorli-red" data-icon="emergency_home">emergency_home</span>
                        Failover Strategy
                    </h3>
<p className="font-caption text-on-surface-variant mb-md leading-relaxed">If US-East health drops below 85%, shift remaining traffic instantly.</p>
<div className="space-y-md">
<div className="bg-surface-container-low border border-outline-variant p-sm rounded-lg">
<label className="block font-caption text-on-surface-variant mb-1">Target Regional Peer 1</label>
<div className="flex justify-between items-center">
<span className="font-label-medium text-on-surface">EU-Central</span>
<span className="font-label-medium text-primary">70%</span>
</div>
</div>
<div className="bg-surface-container-low border border-outline-variant p-sm rounded-lg">
<label className="block font-caption text-on-surface-variant mb-1">Target Regional Peer 2</label>
<div className="flex justify-between items-center">
<span className="font-label-medium text-on-surface">AP-South</span>
<span className="font-label-medium text-primary">30%</span>
</div>
</div>
<button className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-on-surface-variant font-caption hover:bg-surface-bright transition-all">
                            + Add Failover Destination
                        </button>
</div>
</div>
{/*  Surgical Routing Rules  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex-grow">
<div className="flex items-center justify-between mb-md">
<h3 className="font-section-header text-section-header flex items-center gap-2">
<span className="material-symbols-outlined text-secondary" data-icon="route">route</span>
                            Routing Rules
                        </h3>
<button className="p-1 hover:bg-surface-bright rounded text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="add">add</span>
</button>
</div>
<div className="space-y-sm">
{/*  Rule 1  */}
<div className="p-sm bg-surface-container-low border border-outline-variant rounded-lg group">
<div className="flex justify-between items-start mb-2">
<span className="font-label-medium text-on-surface">Latency Opt-01</span>
<span className="px-1.5 py-0.5 rounded text-[10px] bg-tertiary-container/20 text-tertiary uppercase font-bold">Active</span>
</div>
<p className="font-caption text-on-surface-variant leading-tight mb-3">Reroute 10% EU-West → US-East for optimization.</p>
<div className="flex justify-between items-center">
<button className="text-xs text-primary hover:underline">Edit Rule</button>
<span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer" data-icon="more_vert">more_vert</span>
</div>
</div>
{/*  Rule 2  */}
<div className="p-sm bg-surface-container-low border border-outline-variant rounded-lg opacity-60">
<div className="flex justify-between items-start mb-2">
<span className="font-label-medium text-on-surface">CDN Bypass</span>
<span className="px-1.5 py-0.5 rounded text-[10px] bg-outline-variant text-on-surface-variant uppercase font-bold">Paused</span>
</div>
<p className="font-caption text-on-surface-variant leading-tight mb-3">Force direct ingress for known static assets.</p>
<div className="flex justify-between items-center">
<button className="text-xs text-primary hover:underline">Edit Rule</button>
<span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer" data-icon="play_arrow">play_arrow</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/*  Global Action Bar  */}
<div className="mt-xl glass-panel p-lg rounded-2xl flex flex-col md:flex-row items-center justify-between gap-md border-primary/30">
<div className="flex items-center gap-4">
<div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl" data-icon="security_update_warning">security_update_warning</span>
</div>
<div>
<h4 className="font-section-header text-on-surface">Pending Deployment</h4>
<p className="font-caption text-on-surface-variant">3 configuration changes require synchronization to edge nodes.</p>
</div>
</div>
<div className="flex gap-md w-full md:w-auto">
<button className="flex-1 md:flex-none px-8 py-3 rounded-xl border border-outline text-on-surface font-label-medium hover:bg-surface-bright transition-all">Discard Changes</button>
<button onClick={handleApply} disabled={applying} className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-doorli-red text-white font-label-medium shadow-lg shadow-doorli-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
      <span className="material-symbols-outlined" data-icon="publish">publish</span>
      {applying ? 'Applying...' : 'Apply Routing Changes'}
  </button>
</div>
</div>
</main>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 pb-safe bg-surface-container-low dark:bg-surface-container-low border-t border-outline-variant dark:border-outline-variant shadow-lg">
<div className="flex flex-col items-center justify-center bg-secondary-container dark:bg-secondary-container text-on-secondary-container dark:text-on-secondary-container rounded-full px-4 py-1 transition-transform duration-200 active:scale-90 cursor-pointer">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1 hover:bg-surface-bright transition-transform duration-200 active:scale-90 cursor-pointer">
<span className="material-symbols-outlined" data-icon="storefront">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1 hover:bg-surface-bright transition-transform duration-200 active:scale-90 cursor-pointer">
<span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1 hover:bg-surface-bright transition-transform duration-200 active:scale-90 cursor-pointer">
<span className="material-symbols-outlined" data-icon="health_metrics">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1 hover:bg-surface-bright transition-transform duration-200 active:scale-90 cursor-pointer">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</div>
</nav>


    </div>
  );
}
