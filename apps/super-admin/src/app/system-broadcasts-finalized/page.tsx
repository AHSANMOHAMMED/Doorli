"use client";

import React, { useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function SystemBroadcastsFinalizedPage() {

  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 800)); // Mock API delay
    alert('Broadcast sent successfully to all regional clusters.');
    setSending(false);
  };

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Platform Users');
  const [body, setBody] = useState('');

  const handleDispatch = async () => {
    if (!title || !body) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const res = await superAdminFetch('/admin/broadcasts', {
        method: 'POST',
        body: JSON.stringify({ title, audience, body })
      });
      if (res.success) {
        alert('Broadcast dispatched successfully!');
        setTitle('');
        setBody('');
      } else {
        alert(res.error || 'Failed to dispatch broadcast');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top Navigation Bar  */}
<header className="flex justify-between items-center px-margin-mobile h-16 w-full z-50 bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant sticky top-0">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary dark:text-primary">menu</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Super Admin</h1>
</div>
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant dark:text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full cursor-pointer">notifications</span>
<div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
<img alt="Admin Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS3hbdS5_13fzSEs7xaL63uVG7QKaDK4-VmILF4jytcW6JQq90Uq903Bro2l6cdy0apiXRwBNIUTJo4VmIATKCQqLDSi088-gU9MXKH2koiubgihGCC-xuPlWXoPE-2p87b-meUuT_gDpdXSgZGKZ-ZPcTAlstkzrXz0gljet92hYys3JKQeHKjg5177NnhO4snhd5Ma3tQQfx3J91_CaqCULSHlck2zkb1kOPMH45ymP-owgbw5-9KOGdDD7tBQLjpNJ_Zh_5rhAp"/>
</div>
</div>
</header>
<div className="flex pt-16 min-h-screen">
{/*  Sidebar Navigation  */}
<aside className="hidden md:flex h-screen w-64 fixed left-0 bg-surface-container-low border-r border-outline-variant flex-col p-sm space-y-base shadow-xl">
<div className="flex flex-col px-md py-lg mb-md">
<span className="font-screen-title text-screen-title font-bold text-primary">System Shell</span>
<span className="font-label-medium text-label-medium text-on-surface-variant">v2.4.0 • Super User</span>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-md">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-md">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-md">group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-md">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center px-md py-sm bg-secondary-container text-on-secondary-container font-bold rounded-lg" href="#">
<span className="material-symbols-outlined mr-md">settings</span>
<span className="font-body-main text-body-main">System Tools</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-md">help_outline</span>
<span className="font-body-main text-body-main">Support</span>
</a>
</nav>
<div className="mt-auto p-md glass-panel rounded-xl mb-xl">
<div className="flex items-center gap-sm mb-xs">
<div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
<span className="text-caption font-caption text-tertiary uppercase">Cloud Live</span>
</div>
<p className="text-caption font-caption text-on-surface-variant">Worker node: US-EAST-01</p>
</div>
</aside>
{/*  Main Content Area  */}
<main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop bg-background">
<div className="max-w-container-max mx-auto space-y-md">
{/*  Page Header  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
<div>
<h2 className="font-screen-title text-screen-title text-on-background">System Tools</h2>
<p className="font-body-main text-body-main text-on-surface-variant">Core infrastructure controls and health monitoring.</p>
</div>
<div className="flex gap-sm">
<div className="px-md py-sm rounded-xl glass-panel flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary text-sm">dns</span>
<span className="font-label-medium text-label-medium text-secondary uppercase tracking-widest">Production Environment</span>
</div>
</div>
</div>
{/*  Dashboard Grid  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  KPI Cluster  */}
<div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-gutter">
<div className="glass-panel p-md rounded-xl flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">API Success Rate</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">99.98%</span>
<span className="text-tertiary flex items-center font-caption text-caption mb-base">
<span className="material-symbols-outlined text-sm">arrow_upward</span> 0.02%
                                </span>
</div>
</div>
<div className="glass-panel p-md rounded-xl flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active Instances</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">24</span>
<span className="text-on-surface-variant font-caption text-caption mb-base">Healthy</span>
</div>
</div>
<div className="glass-panel p-md rounded-xl border-l-4 border-l-primary-container flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">ERP Latency</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">142<small className="text-sm">ms</small></span>
<span className="text-error flex items-center font-caption text-caption mb-base">
<span className="material-symbols-outlined text-sm">warning</span> +12ms
                                </span>
</div>
</div>
</div>
{/*  Environment Info (Bento Style)  */}
<div className="md:col-span-12 lg:col-span-4 glass-panel p-md rounded-xl row-span-1">
<div className="flex items-center gap-sm mb-md">
<span className="material-symbols-outlined text-on-surface-variant">info</span>
<h3 className="font-section-header text-section-header">Environment Info</h3>
</div>
<ul className="space-y-sm">
<li className="flex justify-between border-b border-outline-variant pb-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant">Kernel Version</span>
<span className="font-body-compact text-body-compact text-on-background">6.2.0-v8-aarch64</span>
</li>
<li className="flex justify-between border-b border-outline-variant pb-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant">Node Registry</span>
<span className="font-body-compact text-body-compact text-on-background">AWS-US-EAST-1</span>
</li>
<li className="flex justify-between border-b border-outline-variant pb-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant">DB Master</span>
<span className="font-body-compact text-body-compact text-on-background">Postgres 15.4 High-Avail</span>
</li>
<li className="flex justify-between">
<span className="font-label-medium text-label-medium text-on-surface-variant">Last Deploy</span>
<span className="font-body-compact text-body-compact text-on-background">2023-11-24 14:02 UTC</span>
</li>
</ul>
</div>
{/*  API Error Rate Chart Placeholder  */}
<div className="md:col-span-12 lg:col-span-8 glass-panel p-md rounded-xl h-80 flex flex-col">
<div className="flex justify-between items-center mb-lg">
<div className="flex flex-col">
<h3 className="font-section-header text-section-header">API Health Matrix</h3>
<span className="font-caption text-caption text-on-surface-variant">Real-time error rate over 24 hours</span>
</div>
<div className="flex gap-xs">
<div className="px-sm py-xs bg-surface-container-highest rounded text-caption font-caption">Last 24h</div>
<div className="px-sm py-xs hover:bg-surface-container-high rounded text-caption font-caption cursor-pointer">7 Days</div>
</div>
</div>
<div className="flex-1 relative overflow-hidden flex items-end gap-1">
{/*  Simple Bar Mock  */}
<div className="flex-1 bg-secondary-container h-[20%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[25%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[22%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-error-container h-[45%] rounded-t-sm animate-pulse"></div>
<div className="flex-1 bg-secondary-container h-[18%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[15%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[10%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[12%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[18%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[25%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[30%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[28%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[15%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[12%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[14%] rounded-t-sm opacity-50"></div>
<div className="flex-1 bg-secondary-container h-[10%] rounded-t-sm opacity-50"></div>
</div>
</div>
{/*  ERP Sync Action  */}
<div className="md:col-span-12 lg:col-span-4 glass-panel p-md rounded-xl flex flex-col justify-between">
<div>
<div className="flex items-center gap-sm mb-md">
<span className="material-symbols-outlined text-primary">sync_problem</span>
<h3 className="font-section-header text-section-header">ERP Integration</h3>
</div>
<div className="space-y-md">
<div className="bg-background/50 border border-outline-variant rounded-lg p-sm">
<div className="flex justify-between mb-xs">
<span className="font-label-medium text-label-medium text-on-surface-variant">Last Sync</span>
<span className="font-label-medium text-label-medium text-tertiary">Success</span>
</div>
<p className="font-body-compact text-body-compact text-on-background">5 minutes ago (2,492 objects synced)</p>
</div>
<p className="font-body-compact text-body-compact text-on-surface-variant leading-relaxed">
                                    Force a manual synchronization between the core Doorli database and the ERP system. Use only during maintenance or troubleshooting.
                                </p>
</div>
</div>
<button className="w-full bg-primary-container text-on-primary-fixed hover:opacity-90 active:scale-95 transition-all h-12 rounded-xl font-bold flex items-center justify-center gap-sm mt-md" onClick={() => {}}><span className="material-symbols-outlined">sync</span>
Force ERP Sync</button>
</div>
{/*  Broadcast Notification Composer  */}
<div className="md:col-span-12 glass-panel p-lg rounded-xl">
<div className="flex items-center gap-sm mb-lg">
<span className="material-symbols-outlined text-secondary">campaign</span>
<h3 className="font-section-header text-section-header">Global Broadcast Composer</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
<div className="space-y-md">
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant">Notification Title</label>
<input className="bg-surface-container-low border border-outline-variant rounded-xl p-md focus:border-secondary outline-none text-on-background" placeholder="e.g. Scheduled System Maintenance" type="text" value={title} onChange={e => setTitle(e.target.value)} />
</div>
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant">Target Audience</label>
<select className="bg-surface-container-low border border-outline-variant rounded-xl p-md focus:border-secondary outline-none text-on-background" value={audience} onChange={e => setAudience(e.target.value)}>
<option>All Platform Users</option>
<option>Vendors Only</option>
<option>Customers Only</option>
<option>Logistics Partners</option>
</select>
</div>
</div>
<div className="flex flex-col gap-xs h-full">
<label className="font-label-medium text-label-medium text-on-surface-variant">Broadcast Body</label>
<textarea className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl p-md focus:border-secondary outline-none text-on-background min-h-[120px] resize-none" placeholder="Enter system-wide message..." value={body} onChange={e => setBody(e.target.value)}></textarea>
</div>
</div>
<div className="mt-xl flex justify-end gap-md">
<button className="px-lg py-md border border-secondary text-secondary rounded-xl font-bold hover:bg-secondary/10 transition-colors">Save Draft</button>
<button className="px-xl py-md bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-sm" onClick={handleDispatch}>
<span className="material-symbols-outlined">send</span>
                                Dispatch Now
                            </button>
</div>
</div>
</div>
</div>
{/*  Bottom spacing for mobile nav  */}
<div className="h-24 md:hidden"></div>
</main>
</div>
{/*  Mobile Bottom Navigation  */}
<nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 px-2 pb-safe bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md md:hidden">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>


    </div>
  );
}
