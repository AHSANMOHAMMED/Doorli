"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingKyc: 0,
    activeDrivers: 0,
    ordersToday: 0,
    revenue30d: 0,
  });

  const [infra, setInfra] = useState<any[]>([]);

  useEffect(() => {
    superAdminFetch('/admin/stats').then((res) => {
      if (res.success) setStats(res.data);
    }).catch(console.error);

    superAdminFetch('/admin/infra').then((res) => {
      if (res.success) setInfra(res.data.services);
    }).catch(console.error);
  }, []);

  const healthPercent = infra.length > 0 
    ? Math.round((infra.filter(s => s.status === 'healthy').length / infra.length) * 100)
    : 100;
  const isHealthy = healthPercent === 100;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Pull to Refresh Simulation Zone  */}
<div className="pull-to-refresh-indicator flex items-center justify-center bg-surface-container-low overflow-hidden" id="refresh-zone">
<span className="material-symbols-outlined animate-spin text-primary py-4">sync</span>
</div>
{/*  Top App Bar  */}
<header className="w-full top-0 sticky bg-background dark:bg-background text-primary dark:text-primary flex justify-between items-center px-margin-mobile h-16 w-full z-50 border-b border-surface-variant dark:border-surface-variant transition-colors duration-200">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-high p-2 rounded-full transition-colors">menu</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Super Admin</h1>
</div>
<div className="flex items-center gap-2">
<div className="hidden md:flex flex-col items-end mr-4">
<span className="text-label-medium font-label-medium text-on-surface">Admin Alex</span>
<span className="text-caption font-caption text-on-surface-variant" id="live-clock">Jul 25, 22:01:45</span>
</div>
<div className="relative cursor-pointer hover:bg-surface-container-high p-2 rounded-full transition-colors">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-2 right-2 w-2 h-2 bg-primary-container rounded-full border border-background"></span>
</div>
</div>
</header>
<main className="pb-24 px-4 pt-4 max-w-screen-container-max mx-auto">
{/*  Welcome Header  */}
<div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
<div>
<h2 className="font-screen-title text-screen-title text-on-surface">Dashboard</h2>
<p className="font-body-main text-body-main text-on-surface-variant">Welcome back. System is running at {healthPercent}% health.</p>
</div>
<div className="md:hidden">
<span className="text-caption font-caption text-on-surface-variant" id="live-clock-mobile">Jul 25, 22:01:45</span>
</div>
</div>
{/*  KPI Grid (2x2 Mobile, 4x1 Desktop)  */}
<div className="bg-surface-container border border-surface-variant rounded-xl p-6 mb-8">
<div className="flex items-center justify-between mb-6">
<h3 className="font-section-header text-section-header text-on-surface">Critical Alerts</h3>
<button type="button" onClick={() => router.push('/global-system-status')} className="text-label-medium font-label-medium text-primary hover:underline">View All</button>
</div>
<div className="space-y-4">
{/*  Alert 1  */}
<div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-error ring-1 ring-error/30 animate-pulse-soft">
<span className="material-symbols-outlined text-error mt-1">report_problem</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<h4 className="text-body-compact font-body-compact font-bold text-on-surface">Database Latency Spike</h4>
<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-error-container text-on-error-container animate-pulse">High Priority</span>
</div>
<p className="text-caption font-caption text-on-surface-variant mt-1">Global latency exceeded 500ms in region US-EAST-1. Investigate scaling groups.</p>
<span className="text-[10px] font-caption text-outline mt-2 block">2 mins ago</span>
<div className="flex justify-end mt-2"><a href="/global-system-status" className="px-3 py-1 text-caption font-label-medium border border-secondary text-secondary rounded-xl hover:bg-secondary/10 transition-colors">Review</a></div></div>
</div>
{/*  Alert 2  */}
<div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-primary">
<span className="material-symbols-outlined text-primary mt-1">shopping_cart_checkout</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<h4 className="text-body-compact font-body-compact font-bold text-on-surface">Failed Transactions Increase</h4>
<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-container text-on-primary-container">Medium Priority</span>
</div>
<p className="text-caption font-caption text-on-surface-variant mt-1">Stripe webhooks reporting 4% failure rate for Vendor ID #8821.</p>
<span className="text-[10px] font-caption text-outline mt-2 block">14 mins ago</span>
<div className="flex justify-end mt-2"><a href="/global-system-status" className="px-3 py-1 text-caption font-label-medium border border-secondary text-secondary rounded-xl hover:bg-secondary/10 transition-colors">Review</a></div></div>
</div>
{/*  Alert 3  */}
<div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low border-l-4 border-secondary">
<span className="material-symbols-outlined text-secondary mt-1">security</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<h4 className="text-body-compact font-body-compact font-bold text-on-surface">Mass Logout Detected</h4>
<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary-container text-on-secondary-container">Medium Priority</span>
</div>
<p className="text-caption font-caption text-on-surface-variant mt-1">Auth tokens revoked for 450 users in London. Possible credential rotation event.</p>
<span className="text-[10px] font-caption text-outline mt-2 block">45 mins ago</span>
<div className="flex justify-end mt-2"><a href="/global-system-status" className="px-3 py-1 text-caption font-label-medium border border-secondary text-secondary rounded-xl hover:bg-secondary/10 transition-colors">Review</a></div></div>
</div>
</div>
</div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
{/*  Active Orders  */}
<div className="bg-surface-container border border-surface-variant p-4 rounded-xl shadow-md flex flex-col justify-between h-32 md:h-40">
<div className="flex justify-between items-start">
<span className="text-caption font-caption text-on-surface-variant">Orders Today</span>
<span className="text-caption font-caption text-tertiary-container flex items-center">+Live <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
</div>
<div>
<div className="font-kpi-number text-kpi-number text-on-surface">{stats.ordersToday}</div>
<div className="w-full h-1 bg-surface-variant rounded-full mt-2 overflow-hidden">
<div className="bg-primary h-full w-[70%]"></div>
</div>
</div>
</div>
{/*  Today's Revenue  */}
<div className="bg-surface-container border border-surface-variant p-4 rounded-xl shadow-md flex flex-col justify-between h-32 md:h-40">
<div className="flex justify-between items-start">
<span className="text-caption font-caption text-on-surface-variant">30d Revenue</span>
<span className="text-caption font-caption text-tertiary-container flex items-center">Live <span className="ml-1 w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span></span>
</div>
<div>
<div className="font-kpi-number text-kpi-number text-on-surface">${stats.revenue30d.toLocaleString()}</div>
<div className="text-caption font-caption text-on-surface-variant mt-1">Total volume</div>
</div>
</div>
{/*  Active Vendors  */}
<div className="bg-surface-container border border-surface-variant p-4 rounded-xl shadow-md flex flex-col justify-between h-32 md:h-40">
<div className="flex justify-between items-start">
<span className="text-caption font-caption text-on-surface-variant">Active Vendors</span>
<span className="material-symbols-outlined text-secondary opacity-50">store</span>
</div>
<div>
<div className="font-kpi-number text-kpi-number text-on-surface">{stats.totalVendors}</div>
<div className="text-caption font-caption text-on-surface-variant mt-1">{stats.pendingKyc} pending approval</div>
</div>
</div>
{/*  Active Drivers  */}
<div className="bg-surface-container border border-surface-variant p-4 rounded-xl shadow-md flex flex-col justify-between h-32 md:h-40">
<div className="flex justify-between items-start">
<span className="text-caption font-caption text-on-surface-variant">Active Drivers</span>
<span className="text-caption font-caption text-secondary flex items-center">Live <span className="material-symbols-outlined text-[14px]">local_shipping</span></span>
</div>
<div>
<div className="font-kpi-number text-kpi-number text-on-surface">{stats.activeDrivers}</div>
<div className="flex -space-x-2 mt-2 overflow-hidden">
<div className="h-6 w-6 rounded-full ring-2 ring-surface-container bg-surface-variant flex items-center justify-center text-[8px] font-bold">...</div>
</div>
</div>
</div>
</div>
{/*  Main Content Area: Charts & Quick Actions  */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
{/*  Live Order Volume Chart (Dense)  */}
<div className="lg:col-span-2 bg-surface-container border border-surface-variant rounded-xl p-6 relative overflow-hidden">
<div className="flex items-center justify-between mb-6">
<div>
<h3 className="font-section-header text-section-header text-on-surface">Live Order Volume</h3>
<p className="text-caption font-caption text-on-surface-variant">Activity recorded over the last 24 hours</p>
</div>
<div className="flex gap-2">
<button className="px-3 py-1 bg-primary-container text-on-primary-container text-caption font-caption rounded-full">24H</button>
<button className="px-3 py-1 bg-surface-variant text-on-surface text-caption font-caption rounded-full">7D</button>
</div>
</div>
<div className="h-48 w-full flex items-end gap-1 relative">
{/*  Simulated Dense Chart bars  */}
<div className="bg-primary/20 hover:bg-primary w-full h-[40%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[35%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[50%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[65%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[55%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[80%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[90%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[75%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[60%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[45%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[50%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[70%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[85%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[60%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[40%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[30%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[45%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[65%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[75%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[95%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[85%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[70%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[60%] transition-all"></div>
<div className="bg-primary/20 hover:bg-primary w-full h-[55%] transition-all"></div>
</div>
<div className="flex justify-between mt-4 text-caption font-caption text-on-surface-variant">
<span className="">00:00</span>
<span className="">06:00</span>
<span className="">12:00</span>
<span className="">18:00</span>
<span className="">Now</span>
</div>
</div>
{/*  Quick Actions  */}
<div className="bg-surface-container border border-surface-variant rounded-xl p-6">
<h3 className="font-section-header text-section-header text-on-surface mb-6">Quick Actions</h3>
<div className="grid grid-cols-2 gap-3">
<button type="button" onClick={() => router.push('/system-broadcasts-finalized')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-high border border-surface-variant hover:bg-primary/10 hover:border-primary transition-all group">
<span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">campaign</span>
<span className="text-label-medium font-label-medium text-on-surface">Broadcast</span>
</button>
<button type="button" onClick={() => router.push('/vendors-management')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-high border border-surface-variant hover:bg-secondary/10 hover:border-secondary transition-all group">
<span className="material-symbols-outlined text-secondary mb-2 group-hover:scale-110 transition-transform">storefront</span>
<span className="text-label-medium font-label-medium text-on-surface">Add Vendor</span>
</button>
<button type="button" onClick={() => router.push('/user-management-visual-variant')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-high border border-surface-variant hover:bg-tertiary/10 hover:border-tertiary transition-all group">
<span className="material-symbols-outlined text-tertiary mb-2 group-hover:scale-110 transition-transform">person_add</span>
<span className="text-label-medium font-label-medium text-on-surface">New User</span>
</button>
<button type="button" onClick={() => router.push('/global-system-status')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-high border border-surface-variant hover:bg-error/10 hover:border-error transition-all group">
<span className="material-symbols-outlined text-error mb-2 group-hover:scale-110 transition-transform">health_metrics</span>
<span className="text-label-medium font-label-medium text-on-surface">Health</span>
</button>
</div>
<div className="mt-6 p-4 rounded-xl bg-surface-container-low border border-surface-variant flex items-center justify-between">
<div className="flex items-center gap-3">
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-tertiary-container' : 'bg-error-container'}`}>
<span className={`material-symbols-outlined text-[18px] ${isHealthy ? 'text-on-tertiary-container' : 'text-on-error-container'}`}>{isHealthy ? 'verified_user' : 'warning'}</span>
</div>
<div>
<p className="text-label-medium font-label-medium text-on-surface">System Health</p>
<p className={`text-caption font-caption ${isHealthy ? 'text-tertiary' : 'text-error'}`}>{isHealthy ? 'Operational' : 'Degraded'}</p>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
</div>
</div>
</div>
{/*  Recent Alerts Feed  */}

</main>
{/*  Bottom Navigation Bar  */}
<nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md h-16 px-2 pb-safe flex justify-around items-center">
{/*  Dashboard (Active)  */}
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150 text-primary" href="/dashboard">
<span className="material-symbols-outlined" >dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
{/*  Vendors  */}
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150 rounded-xl" href="/vendors-management">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
{/*  Users  */}
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150 rounded-xl" href="/user-management-visual-variant">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
{/*  Orders  */}
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150 rounded-xl" href="/order-detail">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
{/*  More  */}
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150 rounded-xl" href="/system-settings-profile">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>
{/*  FAB for Global Broadcast (Contextual to Dashboard)  */}
<button type="button" aria-label="Create broadcast" onClick={() => router.push('/system-broadcasts-finalized')} className="fixed right-6 bottom-20 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 shadow-lg shadow-primary/30">
<span className="material-symbols-outlined text-[28px]">add</span>
</button>




    </div>
  );
}
