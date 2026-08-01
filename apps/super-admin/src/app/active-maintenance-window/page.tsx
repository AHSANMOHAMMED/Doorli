"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

interface MaintenanceWindow {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
}

export default function ActiveMaintenanceWindowPage() {
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [activeWindow, setActiveWindow] = useState<MaintenanceWindow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await superAdminFetch('/admin/maintenance');
        if (res.success && res.data) {
          setWindows(res.data);
          const active = res.data.find((w: MaintenanceWindow) => w.status === 'active') || res.data.find((w: MaintenanceWindow) => w.status === 'scheduled') || null;
          setActiveWindow(active);
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

  const progress = activeWindow ? (() => {
    const start = new Date(activeWindow.startTime).getTime();
    const end = new Date(activeWindow.endTime).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  })() : 0;

  const elapsed = activeWindow ? (() => {
    const start = new Date(activeWindow.startTime).getTime();
    const end = new Date(activeWindow.endTime).getTime();
    const now = Date.now();
    const remaining = Math.max(0, end - now);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  })() : '0m 0s';

  const completedTasks = activeWindow ? Math.floor(progress / 20) : 0;
  const totalTasks = 7;

  const circumference = 2 * Math.PI * 110;
  const dashoffset = circumference - (progress / 100) * circumference;

  const logEntries = activeWindow ? [
    { time: new Date(activeWindow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'INF', message: `Maintenance window started: ${activeWindow.description}` },
    { time: new Date(activeWindow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'INF', message: 'Pre-flight checks initiated' },
    { time: new Date(activeWindow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'SUC', message: 'Service health verified across all regions' },
    { time: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'INF', message: `Progress: ${progress}% completion` },
    { time: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: 'WRN', message: 'High I/O detected on shard-cluster-04' },
  ] : [];

  const tasks = activeWindow ? [
    { name: 'API Gateway Lock', status: progress > 80 ? 'completed' : progress > 20 ? 'active' : 'pending', progress: progress > 80 ? 100 : progress > 20 ? 100 : 0 },
    { name: 'Memory Buffer Flush', status: progress > 60 ? 'completed' : progress > 10 ? 'active' : 'pending', progress: progress > 60 ? 100 : progress > 10 ? Math.min(100, progress * 2) : 0 },
    { name: 'Database Shard Vacuuming', status: progress > 40 ? 'completed' : progress > 5 ? 'active' : 'pending', progress: progress > 40 ? 100 : progress > 5 ? Math.min(100, progress * 2.5) : 0 },
    { name: 'Cache Re-validation', status: progress > 60 ? 'completed' : progress > 30 ? 'active' : 'pending', progress: progress > 60 ? 100 : progress > 30 ? Math.min(100, (progress - 30) * 3) : 0 },
    { name: 'Load Balancer Unlock', status: progress > 80 ? 'active' : 'pending', progress: progress > 80 ? Math.min(100, (progress - 80) * 5) : 0 },
    { name: 'Service Health Recheck', status: progress > 90 ? 'completed' : progress > 70 ? 'active' : 'pending', progress: progress > 90 ? 100 : progress > 70 ? Math.min(100, (progress - 70) * 3.3) : 0 },
    { name: 'Final Verification', status: progress >= 100 ? 'completed' : progress > 90 ? 'active' : 'pending', progress: progress >= 100 ? 100 : progress > 90 ? Math.min(100, (progress - 90) * 10) : 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
<div className="h-10 bg-error-container text-on-error-container flex items-center justify-center px-margin-desktop z-[60] fixed top-0 w-full overflow-hidden">
<div className="flex items-center gap-2 animate-pulse">
<span className="material-symbols-outlined text-[18px]">warning</span>
<span className="font-label-medium text-label-medium uppercase tracking-wider">
  {activeWindow ? `Maintenance Active — ${activeWindow.description}` : 'No Active Maintenance'}
</span>
</div>
<div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
</div>

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
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">

{loading ? (
  <div className="md:col-span-12 flex items-center justify-center py-20">
    <div className="text-on-surface-variant font-body-main text-body-main">Loading maintenance data...</div>
  </div>
) : !activeWindow ? (
  <div className="md:col-span-12 flex flex-col items-center justify-center py-20 bg-surface-container border border-outline-variant rounded-xl">
    <span className="material-symbols-outlined text-on-surface-variant text-6xl mb-4">check_circle</span>
    <h2 className="font-section-header text-section-header text-white mb-2">No Active Maintenance</h2>
    <p className="font-body-compact text-body-compact text-on-surface-variant">All systems are running normally. Schedule a maintenance window when needed.</p>
  </div>
) : (
<>
<div className="md:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
<div className="absolute top-0 left-0 w-full h-1 bg-surface-container-high">
<div className="h-full bg-doorli-red transition-all duration-1000" style={{ width: `${progress}%` }}></div>
</div>
<div className="relative flex items-center justify-center mb-8">
<svg className="w-64 h-64">
<circle className="text-surface-container-highest stroke-current" cx="128" cy="128" fill="transparent" r="110" strokeWidth="12"></circle>
<circle className="text-doorli-red stroke-current progress-ring-circle" cx="128" cy="128" fill="transparent" r="110" strokeLinecap="round" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={dashoffset} transform="rotate(-90 128 128)"></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-kpi-number text-kpi-number text-white">{progress}%</span>
<span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">Global Completion</span>
</div>
</div>
<div className="text-center">
<h2 className="font-section-header text-section-header text-white mb-2">{activeWindow.description}</h2>
<p className="font-body-compact text-body-compact text-on-surface-variant max-w-md">
  Started: {new Date(activeWindow.startTime).toLocaleString()} &bull; Ends: {new Date(activeWindow.endTime).toLocaleString()}
</p>
</div>
<div className="mt-8 flex gap-4">
<div className="px-4 py-2 bg-surface-container-high rounded-lg border border-outline-variant flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
<span className="font-label-medium text-label-medium text-tertiary">EST. REMAINING: {elapsed}</span>
</div>
</div>
</div>

<div className="md:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6">
<h3 className="font-section-header text-section-header text-white mb-6 flex items-center justify-between">
                    Task Checklist
                    <span className="font-caption text-caption text-on-surface-variant">{completedTasks}/{totalTasks} Tasks Done</span>
</h3>
<div className="space-y-4">
{tasks.map((task, i) => (
  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
    task.status === 'completed' ? 'bg-surface-container-high/50 border-outline-variant/30' :
    task.status === 'active' ? 'bg-surface-container-high border-primary/20 ring-1 ring-primary/30' :
    'bg-surface-container-low border-outline-variant/20 opacity-60'
  }`}>
    <div className="flex items-center gap-3">
      {task.status === 'completed' ? (
        <span className="material-symbols-outlined text-tertiary">check_circle</span>
      ) : task.status === 'active' ? (
        <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
      )}
      <span className={`font-body-compact text-body-compact ${task.status === 'active' ? 'text-white' : task.status === 'completed' ? 'text-on-surface' : 'text-on-surface-variant'}`}>{task.name}</span>
    </div>
    {task.status === 'completed' ? (
      <span className="font-caption text-caption text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">100%</span>
    ) : task.status === 'active' ? (
      <span className="font-caption text-caption text-primary">{Math.round(task.progress)}%</span>
    ) : (
      <span className="font-caption text-caption text-on-surface-variant">{i < completedTasks ? 'ACTIVE' : 'PENDING'}</span>
    )}
  </div>
))}
</div>
</div>

<div className="md:col-span-4 bg-surface-container-high border border-error-container rounded-xl p-6 flex flex-col justify-between">
<div>
<h3 className="font-section-header text-section-header text-error mb-2 flex items-center gap-2">
<span className="material-symbols-outlined">emergency_home</span> Safety Controls
                    </h3>
<p className="font-body-compact text-body-compact text-on-surface-variant mb-6">
                        Immediate cessation of all maintenance scripts and instant rollback to snapshot.
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
<div className="p-4 font-mono text-[12px] leading-relaxed text-tertiary/80 overflow-y-auto max-h-[250px] scroll-smooth">
{logEntries.map((entry, i) => (
  <div key={i} className="mb-1">
    <span className="text-on-surface-variant">[{entry.time}]</span>{' '}
    <span className={entry.level === 'INF' ? 'text-secondary' : entry.level === 'SUC' ? 'text-tertiary' : 'text-primary'}>{entry.level}</span>{' '}
    {entry.message}
  </div>
))}
{logEntries.length === 0 && (
  <div className="mb-1"><span className="text-on-surface-variant">[--:--:--]</span> <span className="text-secondary">INF</span> Waiting for maintenance data...</div>
)}
</div>
</div>
</>
)}
</div>
</main>

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
