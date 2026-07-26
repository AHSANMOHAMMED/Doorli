"use client";

import React, { useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function ScheduleMaintenanceWindowPage() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleSchedule = async () => {
    if (!start || !end) {
      alert('Please specify start and end times');
      return;
    }
    try {
      const res = await superAdminFetch('/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify({ start, end })
      });
      if (res.success) {
        alert('Maintenance window scheduled successfully!');
      } else {
        alert(res.error || 'Failed to schedule');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 flex items-center justify-between px-margin-desktop h-16 bg-surface border-b border-outline-variant transition-colors duration-200">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary" >terminal</span>
<h1 className="font-screen-title text-screen-title font-bold text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-6">
<div className="hidden md:flex items-center gap-8">
<a className="font-label-medium text-on-surface-variant hover:bg-surface-container-high px-3 py-2 rounded-lg transition-colors" href="#">Command</a>
<a className="font-label-medium text-on-surface-variant hover:bg-surface-container-high px-3 py-2 rounded-lg transition-colors" href="#">Vendors</a>
<a className="font-label-medium text-on-surface-variant hover:bg-surface-container-high px-3 py-2 rounded-lg transition-colors" href="#">Orders</a>
<a className="font-label-medium text-primary font-bold px-3 py-2 rounded-lg transition-colors" href="#">System</a>
</div>
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-high p-2 rounded-full transition-colors">settings</span>
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container ring-2 ring-outline-variant">
                    AD
                </div>
</div>
</div>
</header>
<main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
{/*  Page Header  */}
<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<nav className="flex items-center gap-2 text-on-surface-variant mb-2">
<span className="font-caption uppercase tracking-wider">System</span>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<span className="font-caption uppercase tracking-wider">Maintenance</span>
</nav>
<h2 className="font-screen-title text-screen-title md:text-[32px] text-on-surface">Schedule Maintenance</h2>
<p className="text-on-surface-variant font-body-main mt-1">First step: Define window, scope, and system state behavior.</p>
</div>
<div className="flex items-center gap-3">
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant">
<div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
<span className="font-caption text-on-surface">System Status: Operational</span>
</div>
</div>
</div>
{/*  Main Form Content: Bento Grid Layout  */}
<div className="bento-grid">
{/*  Timing Section  */}
<section className="col-span-12 lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-primary">schedule</span>
<h3 className="font-section-header text-section-header">Maintenance Window</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<label className="font-label-medium text-on-surface-variant block">Start Date &amp; Time</label>
<div className="relative">
<input className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl px-4 py-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
</div>
</div>
<div className="space-y-2">
<label className="font-label-medium text-on-surface-variant block">Estimated End Date &amp; Time</label>
<div className="relative">
<input className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl px-4 py-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
</div>
</div>
</div>
<div className="mt-6 p-4 bg-surface-container-low border border-outline-variant/30 rounded-lg flex items-start gap-4">
<span className="material-symbols-outlined text-secondary" >info</span>
<div>
<p className="font-label-medium text-on-surface">Timezone: UTC (Central Server Time)</p>
<p className="font-caption text-on-surface-variant">Maintenance tasks are synchronized across global clusters based on this reference.</p>
</div>
</div>
</section>
{/*  Scope Selection  */}
<section className="col-span-12 lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-primary">layers</span>
<h3 className="font-section-header text-section-header">Target Scope</h3>
</div>
<div className="space-y-3">
<label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant cursor-pointer group hover:border-primary transition-all">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">api</span>
<span className="font-body-compact text-on-surface">Public API Gateway</span>
</div>
<input defaultChecked className="rounded bg-background border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
</label>
<label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant cursor-pointer group hover:border-primary transition-all">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">sync_alt</span>
<span className="font-body-compact text-on-surface">ERP Sync Services</span>
</div>
<input defaultChecked className="rounded bg-background border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
</label>
<label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant cursor-pointer group hover:border-primary transition-all">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">database</span>
<span className="font-body-compact text-on-surface">Main DB Clusters</span>
</div>
<input className="rounded bg-background border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
</label>
<label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant cursor-pointer group hover:border-primary transition-all">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant">all_inclusive</span>
<span className="font-body-compact text-on-surface">Entire Ecosystem</span>
</div>
<input className="rounded bg-background border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
</label>
</div>
</section>
{/*  Mode Toggle Section  */}
<section className="col-span-12 lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-primary">power_settings_new</span>
<h3 className="font-section-header text-section-header">Operational Mode</h3>
</div>
<div className="grid grid-cols-2 gap-4">
<button className="flex flex-col items-center gap-3 p-4 rounded-xl border border-secondary bg-secondary/5 text-secondary transition-all" id="mode-readonly">
<span className="material-symbols-outlined text-[32px]">visibility</span>
<div className="text-center">
<span className="block font-label-medium">Read-Only</span>
<span className="block font-caption text-on-surface-variant mt-1">Users can browse but not transact.</span>
</div>
</button>
<button className="flex flex-col items-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-error hover:text-error transition-all" id="mode-offline">
<span className="material-symbols-outlined text-[32px]">cloud_off</span>
<div className="text-center">
<span className="block font-label-medium">Full Offline</span>
<span className="block font-caption text-on-surface-variant mt-1">Complete system black-out.</span>
</div>
</button>
</div>
</section>
{/*  Notification Section  */}
<section className="col-span-12 lg:col-span-7 bg-surface-container border border-outline-variant rounded-xl p-6 shadow-sm">
<div className="flex items-center justify-between mb-6">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary">notifications_active</span>
<h3 className="font-section-header text-section-header">User Notifications</h3>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox" value=""/>
<div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
<div className="space-y-4">
<div className="flex items-center gap-4 p-3 bg-surface-container-high rounded-lg">
<div className="p-2 bg-primary/10 rounded">
<span className="material-symbols-outlined text-primary text-[20px]">mail</span>
</div>
<div className="flex-1">
<span className="block font-label-medium text-on-surface">Email Blast</span>
<span className="block font-caption text-on-surface-variant">Notify all vendors and active admins.</span>
</div>
<input defaultChecked className="rounded bg-background border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
</div>
<div className="space-y-2">
<label className="font-label-medium text-on-surface-variant block">Dashboard Banner Message</label>
<textarea className="w-full bg-surface-container-high border border-outline-variant text-on-surface rounded-xl px-4 py-3 h-24 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-compact" placeholder="E.g., We are performing scheduled maintenance to improve our ERP sync efficiency. Systems will be back by 04:00 UTC.">Doorli will be undergoing scheduled system upgrades. Public APIs will remain read-only during this window. We apologize for the inconvenience.</textarea>
</div>
</div>
</section>
</div>
{/*  System Preview / Visualization  */}
<div className="mt-8 col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 relative overflow-hidden group">

<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
<div className="max-w-md">
<h4 className="font-section-header text-on-surface mb-2">Simulated Impact Analysis</h4>
<p className="font-body-compact text-on-surface-variant">Current configuration will affect approximately 24.5k active sessions. Database load is expected to drop to 2% during the window.</p>
</div>
<div className="flex items-center gap-8">
<div className="text-center">
<span className="block font-kpi-number text-primary">24.5k</span>
<span className="block font-caption text-on-surface-variant uppercase">Affected Users</span>
</div>
<div className="text-center">
<span className="block font-kpi-number text-tertiary">98%</span>
<span className="block font-caption text-on-surface-variant uppercase">Resource Savings</span>
</div>
<div className="text-center">
<span className="block font-kpi-number text-secondary">0</span>
<span className="block font-caption text-on-surface-variant uppercase">Write-Errors</span>
</div>
</div>
</div>
</div>
{/*  Footer Actions  */}
<div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-surface-container border border-outline-variant rounded-xl shadow-lg">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-warning text-yellow-500">warning</span>
<p className="font-body-compact text-on-surface-variant max-w-sm">This action will broadcast a global system warning. Ensure all stakeholders are briefed before deployment.</p>
</div>
<div className="flex items-center gap-4 w-full md:w-auto">
<button className="flex-1 md:flex-none px-8 py-3 rounded-xl border border-outline-variant text-on-surface font-label-medium hover:bg-surface-container-high transition-colors">
                    Save Draft
                </button>
<button className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-[#E63946] text-white font-label-medium hover:brightness-110 active:scale-95 transition-all shadow-md shadow-red-900/20" onClick={handleSchedule}>
                    Schedule Window
                </button>
</div>
</div>
</main>
{/*  BottomNavBar (Visible on Mobile)  */}
<nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container border-t border-outline-variant shadow-sm">
<a className="flex flex-col items-center justify-center text-on-surface-variant scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-primary font-bold scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" >settings_input_component</span>
<span className="font-label-medium">System</span>
</a>
</nav>


    </div>
  );
}
