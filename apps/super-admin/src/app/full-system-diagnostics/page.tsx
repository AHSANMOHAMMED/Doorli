"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function FullSystemDiagnosticsPage() {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    superAdminFetch('/admin/diagnostics')
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Failed to load diagnostics');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const progress = data?.progress ?? 0;
  const elapsed = data?.elapsedTime ?? '--m --s';
  const remaining = data?.estimatedRemaining ?? '--m --s';
  const scanModules = data?.scanModules ?? [];
  const loadedCount = scanModules.filter((m: any) => m.status !== 'pending').length;
  const circumference = 2 * Math.PI * 80;
  const dashOffset = circumference - (progress / 100) * circumference;

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-red-400">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 bg-background border-b border-outline-variant flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary cursor-pointer">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-4">
<div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-full border border-outline-variant">
<div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
<span className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">System Live</span>
</div>
<div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a female technology executive with sharp features, wearing a sleek black blazer. The lighting is dramatic and moody with a subtle red rim light against a dark, tech-oriented studio background. The overall aesthetic is authoritative, clean, and modern." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP1n8tK1JsIi02hfiyo3Mtz2LYZkWiuLID3FyH__XsGnKNRILvrwtUJsvuwot7__F6uTqg0QzOP6KYuisiYDnY2T7bF3Al2h9VtKoGN2O5omur8HO0TEP44sp3wwaxVI92hRQ53O6LuXKfd92gtmvxVgqMjQi0nBUCF7zATiVSturrogcTghN_9lzjXqlM87m4j5igsVFmMc8yZUawspzUWuD1n6hZccOD0OkV2iFygZqz-Eg1zgbi0_TrxwGEV53RjFHPrxMLXY3T"/>
</div>
</div>
</header>
<main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col gap-lg">
{/*  Diagnostic Summary Bento Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
{/*  1. Diagnostic Progress (The Core)  */}
<section className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center relative overflow-hidden">
<div className="absolute top-0 left-0 w-full h-1 bg-surface-container-highest">
<div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }}></div>
</div>
<div className="relative flex flex-col items-center py-xl">
{/*  Progress Circle SVG  */}
<svg className="w-48 h-48">
<circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="8"></circle>
<circle className="text-primary-container progress-ring__circle" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="8"></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-kpi-number text-kpi-number text-white">{progress}%</span>
<span className="font-label-medium text-label-medium text-on-surface-variant uppercase tracking-widest">Scanning</span>
</div>
</div>
<div className="w-full mt-lg grid grid-cols-2 gap-sm">
<div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
<p className="text-caption font-caption text-on-surface-variant">Elapsed Time</p>
<p className="text-body-main font-body-main font-bold">{elapsed}</p>
</div>
<div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
<p className="text-caption font-caption text-on-surface-variant">Est. Remaining</p>
<p className="text-body-main font-body-main font-bold">{remaining}</p>
</div>
</div>
</section>
{/*  2. Scan Categories (The Matrix)  */}
<section className="lg:col-span-7 flex flex-col gap-sm">
<div className="flex justify-between items-end px-1">
<h2 className="font-section-header text-section-header">Active Scan Modules</h2>
<span className="text-caption font-caption text-on-surface-variant">{loadedCount}/{scanModules.length || 8} Modules Loaded</span>
</div>
<div className="space-y-sm">
  {scanModules.map((mod: any) => {
    let borderColor = 'border-outline-variant';
    let bgColor = 'bg-tertiary/10';
    let textColor = 'text-tertiary';
    let iconBg = 'bg-tertiary/10 border border-tertiary/20';
    let statusBg = 'bg-tertiary/10 text-tertiary border border-tertiary/20';
    let opacity = '';
    let animate = '';

    if (mod.status === 'running') {
      borderColor = 'border-primary-container/30';
      bgColor = 'bg-primary-container/10';
      textColor = 'text-primary-container';
      iconBg = 'bg-primary-container/10 border border-primary-container/20';
      statusBg = 'bg-primary-container/10 text-primary-container border border-primary-container/20';
      animate = 'shadow-sm';
    } else if (mod.status === 'warning') {
      borderColor = 'border-secondary/30';
      bgColor = 'bg-secondary/10';
      textColor = 'text-secondary';
      iconBg = 'bg-secondary/10 border border-secondary/20';
      statusBg = 'bg-secondary/10 text-secondary border border-secondary/20';
    } else if (mod.status === 'pending') {
      opacity = 'opacity-60';
      iconBg = 'bg-surface-container-highest border border-outline-variant';
      textColor = 'text-on-surface-variant';
      statusBg = 'bg-surface-container-highest text-on-surface-variant border border-outline-variant';
    }

    return (
    <div key={mod.name} className={`group bg-surface-container border ${borderColor} rounded-xl p-md flex items-center justify-between hover:bg-surface-container-high transition-colors ${animate} ${opacity}`}>
      <div className="flex items-center gap-md">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${textColor} ${mod.status === 'running' ? 'animate-spin' : ''}`}>{mod.icon || 'extension'}</span>
        </div>
        <div>
          <h3 className="font-body-main font-bold">{mod.name}</h3>
          <p className="text-caption font-caption text-on-surface-variant">{mod.description}</p>
        </div>
      </div>
      <div className={`flex items-center gap-sm ${statusBg} px-3 py-1 rounded-full`}>
        {mod.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>}
        {mod.status === 'passed' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>}
        {mod.status === 'warning' && <span className="material-symbols-outlined text-sm">warning</span>}
        {mod.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>}
        <span className="text-label-medium font-label-medium">{mod.status === 'running' ? 'Running...' : mod.status.charAt(0).toUpperCase() + mod.status.slice(1)}</span>
      </div>
    </div>
    );
  })}
  {scanModules.length === 0 && (
    <>
    <div className="group bg-surface-container border border-outline-variant rounded-xl p-md flex items-center justify-between">
      <div className="flex items-center gap-md">
        <div className="w-10 h-10 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary">database</span>
        </div>
        <div>
          <h3 className="font-body-main font-bold">Database Integrity</h3>
          <p className="text-caption font-caption text-on-surface-variant">Validation of relational schemas and indexes</p>
        </div>
      </div>
      <div className="flex items-center gap-sm bg-tertiary/10 text-tertiary px-3 py-1 rounded-full border border-tertiary/20">
        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
        <span className="text-label-medium font-label-medium">Passed</span>
      </div>
    </div>
    </>
  )}
</div>
</section>
</div>
{/*  3. Live Terminal Output  */}
<section className="flex flex-col gap-sm">
<div className="flex items-center gap-2 px-1">
<span className="material-symbols-outlined text-on-surface-variant text-base">terminal</span>
<h2 className="font-label-medium text-label-medium uppercase tracking-widest text-on-surface-variant">Live Diagnostic Logs</h2>
</div>

<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md font-mono text-[12px] leading-relaxed terminal-scroll h-48 overflow-y-auto">
  {data?.logs?.map((log: any, i: number) => {
    let colorClass = 'text-on-surface-variant';
    if (log.level === 'SUCCESS') colorClass = 'text-tertiary';
    if (log.level === 'WARNING') colorClass = 'text-secondary';
    if (log.level === 'RUNNING') colorClass = 'text-primary-container';
    return (
      <div key={i} className="flex gap-4 mb-1">
        <span className="text-outline shrink-0">{log.time}</span>
        <span className={colorClass}>{log.level}</span>
        <span className="text-on-surface">{log.msg}</span>
      </div>
    );
  })}
  <div className="flex gap-4" id="cursor-line">
    <span className="text-outline shrink-0">[14:32:22]</span>
    <span className="text-primary-container animate-pulse">_</span>
  </div>
</div>
</section>

</main>
{/*  4. Action Bar (Fixed Bottom)  */}
<nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container border-t border-outline-variant shadow-lg py-4 px-margin-mobile md:px-margin-desktop">
<div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
<div className="hidden md:flex flex-col">
<p className="text-caption font-caption text-on-surface-variant">Diagnostic Task ID</p>
<p className="text-body-compact font-body-compact font-bold uppercase tracking-tight text-primary">{data?.taskId}</p>
</div>
<div className="flex w-full md:w-auto gap-gutter">
<button className="flex-1 md:flex-none px-lg py-3 rounded-xl border border-secondary text-secondary font-label-medium text-label-medium hover:bg-secondary/5 active:scale-95 transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-base">pause</span>
                    Pause Scan
                </button>
<button className="flex-1 md:flex-none px-lg py-3 rounded-xl bg-primary-container text-on-primary-container font-label-medium text-label-medium hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-base">summarize</span>
                    Export Preliminary Report
                </button>
</div>
</div>
</nav>
{/*  Navigation Shell (BottomNavBar for Mobile)  */}
<div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container z-[60] border-t border-outline-variant">
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</div>
<div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-3 py-1">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</div>
</div>


    </div>
  );
}
