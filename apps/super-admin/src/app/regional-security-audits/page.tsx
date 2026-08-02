"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function RegionalSecurityAuditsPage() {

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      superAdminFetch('/admin/audits'),
      superAdminFetch('/admin/diagnostics'),
    ]).then(([auditRes, diagRes]) => {
      if (auditRes.success) setLogs(auditRes.data);
      if (diagRes.success) setAudits(diagRes.data?.audits || diagRes.data?.logs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full bg-surface dark:bg-surface text-primary dark:text-primary border-b border-outline-variant dark:border-outline-variant shadow-sm flex justify-between items-center px-gutter h-16 z-50">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary" data-icon="security">security</span>
<h1 className="font-screen-title text-screen-title font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<div className="hidden md:flex items-center gap-xs text-on-surface-variant font-label-medium">
<span className="material-symbols-outlined text-sm" data-icon="dns">dns</span>
<span>Node: US-EAST-01</span>
</div>
<div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a high-level system administrator, lit with dramatic blue and red neon lighting to match a command center aesthetic. The individual has a focused, authoritative expression, wearing a sleek black technical jacket. The background is a blurred server room with blinking led lights, emphasizing a technical and secure environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbA6-CGSb70dWWnyKO3zDkuePY6fHO3h7v6syLF0Ifnvl1XEnN07Z88b9NzsWH18BRHj28wT4WSntsCfWz5jJOpD6Y97NFBYhw6YCbyA9NADHZpu9Al1Ta2x6jBQ0KxoRJO0Za2edUL_ax26_hD1mCkbp9TW9JjTm5TVyAhWCi2Li7P8KRzys2Ujubzl27vMX4Pygb65qRd1ItjG2reDjqU2rsa81udhSCEXf5AxlTu--JeDHd0N3FgPgs5V-DkMNw4NlrhSyJC1cX"/>
</div>
</div>
</header>
{/*  NavigationDrawer  */}
<aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[240px] bg-surface-container dark:bg-surface-container border-r border-outline-variant dark:border-outline-variant flex flex-col py-md z-40 hidden md:flex">
<div className="px-md mb-lg">
<h2 className="font-section-header text-section-header text-on-surface">Command Center</h2>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center gap-md px-md py-sm mx-2 my-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 ease-in-out font-label-medium text-label-medium" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center gap-md px-md py-sm mx-2 my-1 bg-secondary-container text-on-secondary-container rounded-lg font-label-medium text-label-medium transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined" data-icon="verified_user">verified_user</span>
<span>Security Audits</span>
</a>
<a className="flex items-center gap-md px-md py-sm mx-2 my-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 ease-in-out font-label-medium text-label-medium" href="#">
<span className="material-symbols-outlined" data-icon="public">public</span>
<span>Regional Map</span>
</a>
<a className="flex items-center gap-md px-md py-sm mx-2 my-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 ease-in-out font-label-medium text-label-medium" href="#">
<span className="material-symbols-outlined" data-icon="terminal">terminal</span>
<span>System Logs</span>
</a>
<a className="flex items-center gap-md px-md py-sm mx-2 my-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 ease-in-out font-label-medium text-label-medium" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</nav>
<div className="mt-auto px-md pt-lg border-t border-outline-variant/30">
<div className="flex items-center gap-sm text-tertiary">
<span className="material-symbols-outlined" data-icon="shield_with_heart" >shield_with_heart</span>
<span className="text-caption font-caption uppercase tracking-wider">System Protected</span>
</div>
</div>
</aside>
{/*  Main Content  */}
<main className="md:ml-[240px] pt-16 min-h-screen px-margin-mobile md:px-margin-desktop pb-xl">
{/*  Header & Regional Toggle  */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center py-lg gap-md">
<div>
<h2 className="font-screen-title text-screen-title text-on-surface">Regional Security Audits</h2>
<p className="text-on-surface-variant text-body-compact">Monitoring infrastructure integrity across global nodes</p>
</div>
{/*  Segmented Control  */}
<div className="bg-surface-container-high p-1 rounded-xl flex items-center gap-xs">
<button className="px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg font-label-medium text-label-medium transition-all">US-East</button>
<button className="px-md py-sm text-on-surface-variant hover:text-on-surface font-label-medium text-label-medium transition-all">EU-Central</button>
<button className="px-md py-sm text-on-surface-variant hover:text-on-surface font-label-medium text-label-medium transition-all">AP-South</button>
</div>
</div>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/*  Security Pulse (KPI Card)  */}
<div className="md:col-span-8 bg-surface-container border border-outline-variant p-lg rounded-xl flex flex-col gap-lg shadow-lg relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 opacity-10">

</div>
<div className="flex items-center justify-between z-10">
<h3 className="font-section-header text-section-header text-on-surface">Security Pulse</h3>
<span className="px-sm py-xs bg-tertiary/10 text-tertiary rounded-full text-caption font-caption tracking-widest uppercase">Live Monitoring</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-lg z-10">
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant text-label-medium font-label-medium">Overall Status</span>
<div className="flex items-center gap-sm">
<span className="w-3 h-3 rounded-full bg-tertiary glow-green animate-pulse"></span>
<span className="font-kpi-number text-kpi-number text-tertiary">STABLE</span>
</div>
</div>
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant text-label-medium font-label-medium">Threat Level</span>
<div className="flex items-end gap-md">
<span className="font-kpi-number text-kpi-number text-on-surface">LOW</span>
<div className="h-10 w-24 pb-1">
<svg className="w-full h-full text-tertiary stroke-current fill-none stroke-2" viewBox="0 0 100 30">
<path d="M0,25 Q10,24 20,25 T40,24 T60,25 T80,24 T100,25"></path>
</svg>
</div>
</div>
</div>
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant text-label-medium font-label-medium">Compliance</span>
<span className="font-kpi-number text-kpi-number text-secondary">98% SOC2</span>
</div>
</div>
</div>
{/*  Infrastructure Hardening  */}
<div className="md:col-span-4 bg-surface-container border border-outline-variant p-lg rounded-xl shadow-lg">
<h3 className="font-section-header text-section-header text-on-surface mb-lg">Infrastructure Hardening</h3>
<div className="space-y-md">
<div className="flex items-center justify-between p-sm border-b border-outline-variant/30">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-tertiary" data-icon="encrypted">encrypted</span>
<span className="text-body-compact">Zero Trust Network</span>
</div>
<span className="text-caption font-caption bg-tertiary/10 text-tertiary px-sm py-xs rounded uppercase">Active</span>
</div>
<div className="flex items-center justify-between p-sm border-b border-outline-variant/30">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-tertiary" data-icon="lock">lock</span>
<span className="text-body-compact">256-bit Encryption</span>
</div>
<span className="text-caption font-caption bg-tertiary/10 text-tertiary px-sm py-xs rounded uppercase">Verified</span>
</div>
<div className="flex items-center justify-between p-sm">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-tertiary" data-icon="key">key</span>
<span className="text-body-compact">Multi-Factor Auth</span>
</div>
<span className="text-caption font-caption bg-tertiary/10 text-tertiary px-sm py-xs rounded uppercase">Enforced</span>
</div>
</div>
</div>
{/*  Threat Detection Feed  */}
<div className="md:col-span-5 bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-lg flex flex-col">
<div className="p-lg border-b border-outline-variant flex items-center justify-between bg-surface-container-high/50">
<h3 className="font-section-header text-section-header text-on-surface">Threat Detection Feed</h3>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface" data-icon="filter_list">filter_list</span>
</div>
<div className="flex-1 overflow-y-auto max-h-[400px]">
{audits.length === 0 ? (
  <div className="p-md text-center text-on-surface-variant text-caption">No recent threats</div>
) : (
  audits.slice(0, 4).map((audit: any, i: number) => (
    <div key={audit.id || i} className="p-md border-b border-outline-variant/20 hover:bg-surface-variant transition-colors group">
      <div className="flex justify-between items-start mb-xs">
        <span className="text-body-compact font-bold text-on-surface">{audit.action || audit.type || 'Security Event'}</span>
        <span className={`text-caption font-caption px-2 py-0.5 rounded ${audit.status === 'SUCCESS' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
          {audit.status === 'SUCCESS' ? 'INTERCEPTED' : 'LOGGED'}
        </span>
      </div>
      <div className="flex items-center justify-between text-caption text-on-surface-variant">
        <span>{audit.user || audit.actor || 'System'}</span>
        <span>{audit.timestamp ? new Date(audit.timestamp).toLocaleTimeString() : 'Recent'}</span>
      </div>
    </div>
  ))
)}
</div>
<div className="p-sm text-center bg-surface-container-high/30">
<button className="text-caption font-caption text-secondary hover:underline">View All Interceptions</button>
</div>
</div>
{/*  Regional Security Logs Table  */}
<div className="md:col-span-7 bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-lg flex flex-col">
<div className="p-lg border-b border-outline-variant flex items-center justify-between bg-surface-container-high/50">
<h3 className="font-section-header text-section-header text-on-surface">Regional Security Logs</h3>
<div className="flex items-center gap-md">
<div className="relative">
<input className="bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-xs text-caption focus:border-secondary focus:ring-0 w-48" placeholder="Search actor..." type="text"/>
<span className="material-symbols-outlined absolute right-2 top-1.5 text-on-surface-variant text-sm" data-icon="search">search</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface" data-icon="download">download</span>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-high/30">
<tr>
<th className="px-md py-sm text-caption font-caption text-on-surface-variant uppercase tracking-wider">Timestamp</th>
<th className="px-md py-sm text-caption font-caption text-on-surface-variant uppercase tracking-wider">Actor</th>
<th className="px-md py-sm text-caption font-caption text-on-surface-variant uppercase tracking-wider">Action</th>
<th className="px-md py-sm text-caption font-caption text-on-surface-variant uppercase tracking-wider">Result</th>
</tr>
</thead>

<tbody className="text-body-compact divide-y divide-outline-variant/20">
  {logs.map((log) => (
    <tr key={log.id} className="hover:bg-surface-variant transition-colors">
      <td className="px-md py-md text-on-surface-variant font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
      <td className="px-md py-md font-medium text-secondary">{log.user}</td>
      <td className="px-md py-md">{log.action}</td>
      <td className="px-md py-md">
        <span className={`flex items-center gap-xs ${log.status === 'SUCCESS' ? 'text-tertiary' : 'text-error'}`}>
          <span className="material-symbols-outlined text-sm" data-icon={log.status === 'SUCCESS' ? "check_circle" : "cancel"}>
            {log.status === 'SUCCESS' ? "check_circle" : "cancel"}
          </span>
          {log.status === 'SUCCESS' ? 'Success' : 'Fail'}
        </span>
      </td>
    </tr>
  ))}
</tbody>

</table>
</div>
<div className="mt-auto border-t border-outline-variant p-md bg-surface-container-high/20 flex items-center justify-between">
<span className="text-caption text-on-surface-variant">Showing {logs.length} entries</span>
<div className="flex items-center gap-sm">
<button className="p-xs hover:bg-surface-variant rounded transition-colors text-on-surface-variant active:opacity-50">
<span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
</button>
<span className="text-caption px-sm font-bold">1</span>
<button className="p-xs hover:bg-surface-variant rounded transition-colors text-on-surface-variant active:opacity-50">
<span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</main>
{/*  FAB (Contextual for Action)  */}
<button className="fixed bottom-lg right-lg w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
<span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300" data-icon="sync">sync</span>
<div className="absolute right-16 bg-surface-container-highest border border-outline-variant text-body-compact px-md py-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Force Global Sync
        </div>
</button>
{/*  Micro-interaction Script  */}


    </div>
  );
}
