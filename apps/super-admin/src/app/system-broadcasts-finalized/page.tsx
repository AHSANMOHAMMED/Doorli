"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  message: string;
}

export default function SystemBroadcastsFinalizedPage() {
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiSuccessRate, setApiSuccessRate] = useState('--');
  const [activeInstances, setActiveInstances] = useState(0);
  const [erpLatency, setErpLatency] = useState(0);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Platform Users');
  const [body, setBody] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const diagRes = await superAdminFetch('/admin/diagnostics');
        if (diagRes.success && diagRes.data) {
          const checks: DiagnosticCheck[] = diagRes.data.checks || [];
          setDiagnostics(checks);
          const okCount = checks.filter((c) => c.status === 'ok').length;
          const rate = checks.length > 0 ? ((okCount / checks.length) * 100).toFixed(2) : '0.00';
          setApiSuccessRate(rate);
          setActiveInstances(checks.filter((c) => c.status === 'ok').length);
          const erpCheck = checks.find((c) => c.name.toLowerCase().includes('erp'));
          setErpLatency(erpCheck ? erpCheck.latencyMs : 0);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDispatch = async () => {
    if (!title || !body) {
      alert('Please fill out all fields');
      return;
    }
    setSending(true);
    try {
      const res = await superAdminFetch('/admin/broadcasts', {
        method: 'POST',
        body: JSON.stringify({ title, body, audience }),
      });
      if (res.success) {
        alert(`Broadcast dispatched successfully to ${res.count || 'all'} users!`);
        setTitle('');
        setBody('');
      } else {
        alert(res.error || 'Failed to dispatch broadcast');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('doorli-broadcast-draft', JSON.stringify({ title, audience, body }));
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 2500);
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
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/dashboard">
<span className="material-symbols-outlined mr-md">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/erp-synchronization-logs">
<span className="material-symbols-outlined mr-md">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/user-management">
<span className="material-symbols-outlined mr-md">group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/system-broadcasts">
<span className="material-symbols-outlined mr-md">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center px-md py-sm bg-secondary-container text-on-secondary-container font-bold rounded-lg" href="/system-broadcasts-finalized">
<span className="material-symbols-outlined mr-md">settings</span>
<span className="font-body-main text-body-main">System Tools</span>
</a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="mailto:support@doorli.me">
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

{loading ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-on-surface-variant font-body-main text-body-main">Loading system data...</div>
  </div>
) : error ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-error font-body-main text-body-main">Error: {error}</div>
  </div>
) : (
<>
{/*  Dashboard Grid  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  KPI Cluster  */}
<div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-gutter">
<div className="glass-panel p-md rounded-xl flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">API Success Rate</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">{apiSuccessRate}%</span>
<span className="text-tertiary flex items-center font-caption text-caption mb-base">
<span className="material-symbols-outlined text-sm">arrow_upward</span> Live
                                </span>
</div>
</div>
<div className="glass-panel p-md rounded-xl flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">Active Instances</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">{activeInstances}</span>
<span className="text-on-surface-variant font-caption text-caption mb-base">Healthy</span>
</div>
</div>
<div className="glass-panel p-md rounded-xl border-l-4 border-l-primary-container flex flex-col justify-between h-32">
<span className="font-label-medium text-label-medium text-on-surface-variant">ERP Latency</span>
<div className="flex items-end justify-between">
<span className="font-kpi-number text-kpi-number text-on-background">{erpLatency > 0 ? <>{erpLatency}<small className="text-sm">ms</small></> : 'N/A'}</span>
{erpLatency > 200 ? (
  <span className="text-error flex items-center font-caption text-caption mb-base">
    <span className="material-symbols-outlined text-sm">warning</span> High
  </span>
) : (
  <span className="text-tertiary flex items-center font-caption text-caption mb-base">
    <span className="material-symbols-outlined text-sm">check</span> Normal
  </span>
)}
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
{diagnostics.map((check) => (
  <li key={check.name} className="flex justify-between border-b border-outline-variant pb-xs">
    <span className="font-label-medium text-label-medium text-on-surface-variant">{check.name}</span>
    <span className={`font-body-compact text-body-compact ${check.status === 'ok' ? 'text-tertiary' : check.status === 'degraded' ? 'text-secondary' : 'text-error'}`}>
      {check.status === 'ok' ? 'Healthy' : check.status === 'degraded' ? 'Degraded' : 'Down'} ({check.latencyMs}ms)
    </span>
  </li>
))}
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
{diagnostics.map((check) => (
  <div
    key={check.name}
    className={`flex-1 rounded-t-sm ${check.status === 'ok' ? 'bg-secondary-container opacity-50' : check.status === 'degraded' ? 'bg-error-container animate-pulse' : 'bg-error'}`}
    style={{ height: `${Math.max(10, 100 - check.latencyMs / 10)}%` }}
    title={`${check.name}: ${check.status} (${check.latencyMs}ms)`}
  />
))}
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
<span className="font-label-medium text-label-medium text-tertiary">{erpLatency > 0 ? 'Active' : 'Unavailable'}</span>
</div>
<p className="font-body-compact text-body-compact text-on-background">{erpLatency > 0 ? `Latency: ${erpLatency}ms` : 'ERP service not reachable'}</p>
</div>
<p className="font-body-compact text-body-compact text-on-surface-variant leading-relaxed">
                                    Force a manual synchronization between the core Doorli database and the ERP system. Use only during maintenance or troubleshooting.
                                </p>
</div>
</div>
<a href="/erp-synchronization-logs" className="w-full bg-primary-container text-on-primary-fixed hover:opacity-90 active:scale-95 transition-all h-12 rounded-xl font-bold flex items-center justify-center gap-sm mt-md"><span className="material-symbols-outlined">sync</span>
View ERP Sync Logs</a>
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
<button type="button" onClick={handleSaveDraft} className="px-lg py-md border border-secondary text-secondary rounded-xl font-bold hover:bg-secondary/10 transition-colors">{draftSaved ? 'Draft Saved' : 'Save Draft'}</button>
<button
  className={`px-xl py-md bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-sm ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
  onClick={handleDispatch}
  disabled={sending}
>
  <span className="material-symbols-outlined">{sending ? 'hourglass_empty' : 'send'}</span>
  {sending ? 'Dispatching...' : 'Dispatch Now'}
</button>
</div>
</div>
</div>
</>
)}
</div>
{/*  Bottom spacing for mobile nav  */}
<div className="h-24 md:hidden"></div>
</main>
</div>
{/*  Mobile Bottom Navigation  */}
<nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 px-2 pb-safe bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md md:hidden">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/vendors-management">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/user-management">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/global-orders-finalized">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="/system-settings-profile">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>


    </div>
  );
}
