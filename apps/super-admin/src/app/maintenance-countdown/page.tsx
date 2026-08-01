"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function MaintenanceCountdownPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    superAdminFetch('/admin/diagnostics')
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Failed to load diagnostics');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const computeTimeLeft = useCallback(() => {
    if (!data?.maintenanceWindow?.startTime) return { hours: 0, minutes: 0, seconds: 0 };
    const start = new Date(data.maintenanceWindow.startTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, start - now);
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [data]);

  useEffect(() => {
    if (!data) return;
    setTimeLeft(computeTimeLeft());
    const interval = setInterval(() => setTimeLeft(computeTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [data, computeTimeLeft]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timerDisplay = `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

  const activeSessions = data?.activeSessions ?? 0;
  const drainRate = data?.drainRate ?? 0;
  const broadcastStatus = data?.broadcastStatus ?? {};
  const windowMinutes = data?.maintenanceWindow?.durationMinutes ?? 0;
  const windowStatus = data?.maintenanceWindow?.status ?? 'Pending';
  const windowScope = data?.maintenanceWindow?.scope ?? 'Global';
  const windowType = data?.maintenanceWindow?.type ?? 'Critical';
  const progressPercent = data?.maintenanceWindow?.progressPercent ?? 0;

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-red-400">Error: {error}</div>;
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 flex items-center justify-between px-margin-desktop h-16 bg-surface border-b border-outline-variant transition-colors duration-200">
<div className="flex items-center gap-4">
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional high-resolution headshot of a female system administrator with a confident expression, set against a blurred high-tech server room background with deep red and charcoal grey lighting. The image style is sharp and cinematic, matching the Doorli Admin command center aesthetic with high contrast and professional studio lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhRU4_dt55phtqbBkZ-_tL8RZFQmwlQwFnS4aQcp-osNFLNGl7zpY_BUirMNsSdehrv6tqpFoPy5fE-bB8zBbPlK4ZfcWhitM7-S2C6so7MytroPNrxt1oBhQbd5HBK3GOrluZvBOG9CmIcdRBiJgisktfqQ_iTWTCWnXq9mr7kPHCMAeuyZo6tnCEZMs0r7ZA77LINLVAUeRg867xnHDFFS-pdKgWg1b4SeRNVzU4Q1PQp5PD0ZscW43p8f4kMIH7doDQBbG03YfT"/>
</div>
<span className="font-screen-title text-screen-title font-bold text-primary">Doorli Admin</span>
</div>
<div className="flex items-center gap-4 text-on-surface-variant">
<span className="material-symbols-outlined hover:bg-surface-container-high p-2 rounded-full cursor-pointer transition-colors">settings</span>
</div>
</header>
<main className="pt-20 pb-20 px-margin-mobile md:px-margin-desktop h-screen flex flex-col items-center justify-center relative">
{/*  Background Atmospheric Element  */}
<div className="absolute inset-0 z-0 pointer-events-none opacity-20">

</div>
<div className="max-w-6xl w-full z-10 grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  Main Countdown Hero (Bento Style)  */}
<div className="md:col-span-8 space-y-gutter">
<div className="glass-panel rounded-xl p-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
<div className="absolute top-0 left-0 w-full h-1 bg-surface-container-highest">
<div className="h-full bg-primary transition-all duration-1000 ease-linear" id="progress-bar" style={{ width: `${progressPercent}%` }}></div>
</div>
<div className="flex items-center gap-2 text-primary mb-md">
<span className="material-symbols-outlined animate-pulse" >warning</span>
<span className="font-label-medium text-label-medium tracking-widest uppercase">System Maintenance Protocol Alpha-9</span>
</div>
<h1 className="font-screen-title text-5xl md:text-7xl mb-xl text-on-surface tracking-tighter countdown-digit" id="timer">{timerDisplay}</h1>
<div className="grid grid-cols-4 gap-xl w-full max-w-2xl border-t border-outline-variant pt-xl">
<div>
<div className="text-on-surface-variant font-caption text-caption uppercase mb-1">Status</div>
<div className="text-tertiary font-section-header text-section-header">{windowStatus}</div>
</div>
<div>
<div className="text-on-surface-variant font-caption text-caption uppercase mb-1">Window</div>
<div className="text-on-surface font-section-header text-section-header">{windowMinutes}m</div>
</div>
<div>
<div className="text-on-surface-variant font-caption text-caption uppercase mb-1">Scope</div>
<div className="text-on-surface font-section-header text-section-header">{windowScope}</div>
</div>
<div>
<div className="text-on-surface-variant font-caption text-caption uppercase mb-1">Type</div>
<div className="text-on-surface font-section-header text-section-header">{windowType}</div>
</div>
</div>
</div>
{/*  Action Bar  */}
<div className="flex flex-col md:flex-row gap-md items-stretch">
<button className="flex-1 h-14 rounded-xl bg-primary text-on-primary font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 group animate-pulse-red">
<span className="material-symbols-outlined">bolt</span>
                        EMERGENCY START
                    </button>
<button className="flex-1 h-14 rounded-xl border border-secondary text-secondary font-bold hover:bg-secondary-container/20 transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined">schedule</span>
                        POSTPONE 15M
                    </button>
</div>
</div>
{/*  Sidebar Stats/Info  */}
<div className="md:col-span-4 space-y-gutter">
{/*  Live Statistics Card  */}
<div className="glass-panel rounded-xl p-md">
<div className="flex items-center justify-between mb-md">
<span className="font-section-header text-section-header">Live Statistics</span>
<span className="flex h-2 w-2 rounded-full bg-tertiary"></span>
</div>
<div className="space-y-md">
<div className="flex items-end justify-between">
<div>
<div className="text-on-surface-variant font-caption text-caption mb-1">Active Sessions</div>
<div className="font-kpi-number text-kpi-number text-on-surface">{activeSessions.toLocaleString()}</div>
</div>
<div className="text-error font-label-medium text-label-medium mb-1 flex items-center">
<span className="material-symbols-outlined text-sm">trending_up</span>
                                +2%
                            </div>
</div>
<div className="space-y-sm">
<div className="flex justify-between text-caption font-caption text-on-surface-variant">
<span>Session Drain Rate</span>
<span>{drainRate}/min</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full" ></div>
</div>
</div>
</div>
</div>
{/*  Broadcast Status  */}
<div className="glass-panel rounded-xl p-md">
<div className="font-section-header text-section-header mb-md">Broadcast Status</div>
<div className="space-y-md">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" >mail</span>
</div>
<div className="flex-1">
<div className="text-label-medium font-label-medium text-on-surface">Email Notification</div>
<div className="text-caption font-caption text-on-surface-variant">{broadcastStatus.email ?? 'N/A'}</div>
</div>
<span className="material-symbols-outlined text-tertiary">check_circle</span>
</div>
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" >notifications_active</span>
</div>
<div className="flex-1">
<div className="text-label-medium font-label-medium text-on-surface">Push Notification</div>
<div className="text-caption font-caption text-on-surface-variant">{broadcastStatus.push ?? 'N/A'}</div>
</div>
<span className="material-symbols-outlined text-tertiary">check_circle</span>
</div>
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" >hub</span>
</div>
<div className="flex-1">
<div className="text-label-medium font-label-medium text-on-surface">External Webhooks</div>
<div className="text-caption font-caption text-on-surface-variant">{broadcastStatus.webhooks ?? 'N/A'}</div>
</div>
{broadcastStatus.webhooksPending ? (
  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
) : (
  <span className="material-symbols-outlined text-tertiary">check_circle</span>
)}
</div>
</div>
</div>
{/*  Image Contextual Support  */}
<div className="rounded-xl h-40 relative overflow-hidden border border-outline-variant group">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="A high-density technical diagram of a global server network with glowing nodes and interconnecting data pathways. The style is a dark corporate technical aesthetic, with primary red accents and electric blue highlights. The background is a deep charcoal grey with subtle grid patterns, suggesting a sophisticated infrastructure monitoring interface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2qpZnabYXd65QuXZrTrMlO-aFkPxJUilJEGlofMDNmGfBWovPiwXNxx5o8Avc3SDn_jM7prV3II4tqXjU0n_-mZrZb4xISohtMm8udWlyoEEwW-bT923xWfPjM8oUby693vVmoGnipAemOBjILbXQO6xjeBr0-f7luQSwV1UI_C4dkmA2Sowb7o8RINKdnFjVX4Xj-Tvx183jogt-GlAo5uXn_f_6R9pKuVHR17EYwzVCSvECGhuWXZY8_7rv01rU0QLazA5591vj"/>
<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
<div className="absolute bottom-3 left-3 flex items-center gap-2">
<span className="material-symbols-outlined text-sm text-primary">lan</span>
<span className="text-caption font-caption text-on-surface font-bold">NODE CLUSTER: US-EAST-1</span>
</div>
</div>
</div>
</div>
</main>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container border-t border-outline-variant shadow-sm md:hidden">
<div className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-transform active:scale-90 p-2">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-transform active:scale-90 p-2">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-transform active:scale-90 p-2">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</div>
<div className="flex flex-col items-center justify-center text-primary font-bold hover:bg-surface-variant transition-transform active:scale-90 p-2">
<span className="material-symbols-outlined" >monitor_heart</span>
<span className="font-label-medium text-label-medium">Health</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-transform active:scale-90 p-2">
<span className="material-symbols-outlined">settings_input_component</span>
<span className="font-label-medium text-label-medium">System</span>
</div>
</nav>


    </div>
  );
}
