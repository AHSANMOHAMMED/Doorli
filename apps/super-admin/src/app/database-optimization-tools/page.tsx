"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function DatabaseOptimizationToolsPage() {

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminFetch('/admin/db-stats').then(res => {
      if (res.success) setStats(res.data);
      setLoading(false);
    });
  }, []);

  const handleOptimize = async (table: string) => {
    alert('Optimizing ' + table + '...');
    await superAdminFetch('/admin/db-optimize', { method: 'POST' });
    alert('Optimization queued');
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="fixed top-0 w-full z-50 bg-background border-b border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-primary" data-icon="grid_view">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Admin</h1>
</div>
<div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline flex items-center justify-center overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional high-contrast avatar of a system administrator in a dark, technical workspace. The lighting is low-key with subtle red and teal backlighting reflecting off glass surfaces. The style is sharp, corporate modern, and authoritative, matching the deep charcoal and red color palette of the admin dashboard." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1rLLeumyfnDf9gVwA2Nf3WeaJSTlzXaNonkDeYVOsull75YvwFt-lT2rV1syUjNlaMx6GbtTIX33vWkfvAPHWtf95nz4O-MlSDH2IpagiQDwH2_ix20K9TdpE9875u_NNvOP7MLP9kpm0cH5paB2iQpJ_38MO1FRlBIfLq3-clRkBywoxZUmQ8V8QVmRBdbiYr3wIFne5uoblc9BRj0VuTtXnXyofczYOdllbgPtkc-tEIaUdgF4CXwRGp56Fl1FhjlRThXFOTkcM"/>
</div>
</header>
{/*  Main Content Canvas  */}
<main className="pt-20 pb-24 px-margin-mobile max-w-md mx-auto space-y-md">
{/*  Screen Title Section  */}
<section className="mb-sm">
<h2 className="font-screen-title text-screen-title text-on-surface">Optimization Tools</h2>
<p className="font-caption text-caption text-on-surface-variant">Database cluster performance &amp; shard health</p>
</section>
{/*  Performance Overview (Bento Grid Style)  */}
<section className="grid grid-cols-2 gap-sm">
<div className="col-span-2 bg-surface-container border border-outline-variant p-md rounded-xl relative overflow-hidden">
<div className="absolute top-0 right-0 p-sm opacity-20">
<span className="material-symbols-outlined text-tertiary text-4xl" data-icon="database">database</span>
</div>
<p className="font-label-medium text-label-medium text-on-surface-variant mb-xs">Total Records</p>
<h3 className="font-kpi-number text-kpi-number text-on-surface">84.2M</h3>
<div className="flex items-center mt-xs text-tertiary gap-1">
<span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
<span className="text-xs font-bold">+1.2M this month</span>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-xs">Index Coverage</p>
<div className="flex items-baseline gap-xs">
<span className="font-section-header text-section-header text-tertiary">98.4%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-sm overflow-hidden">
<div className="bg-tertiary h-full w-[98.4%]"></div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-xs">Query Latency</p>
<div className="flex items-baseline gap-xs">
<span className="font-section-header text-section-header text-primary">12ms</span>
</div>
<div className="flex items-center mt-xs text-primary gap-1">
<span className="material-symbols-outlined text-xs" data-icon="bolt">bolt</span>
<span className="text-[10px] uppercase font-bold tracking-wider">Optimal</span>
</div>
</div>
</section>
{/*  Maintenance Controls  */}
<section className="space-y-sm">
<h4 className="font-section-header text-section-header text-on-surface flex items-center gap-sm">
<span className="material-symbols-outlined text-primary" data-icon="build_circle">build_circle</span>
                Maintenance Controls
            </h4>
<div className="grid grid-cols-1 gap-sm">
<button className="flex items-center justify-between bg-surface-container-high border border-outline-variant px-md py-sm rounded-xl transition-all active:scale-[0.98]">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary" data-icon="cleaning_services">cleaning_services</span>
<span className="font-label-medium text-label-medium">Clear Cache Pools</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant text-sm" data-icon="chevron_right">chevron_right</span>
</button>
<button className="flex items-center justify-between bg-surface-container-high border border-outline-variant px-md py-sm rounded-xl transition-all active:scale-[0.98]">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-primary" data-icon="compress">compress</span>
<span className="font-label-medium text-label-medium">Vacuum Databases</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant text-sm" data-icon="chevron_right">chevron_right</span>
</button>
<button className="flex items-center justify-between bg-primary-container text-on-primary-container px-md py-sm rounded-xl transition-all active:scale-[0.98] font-bold">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined" data-icon="fact_check">fact_check</span>
<span className="font-label-medium text-label-medium">Run Integrity Check</span>
</div>
<span className="material-symbols-outlined text-sm" data-icon="play_arrow">play_arrow</span>
</button>
</div>
</section>
{/*  Active Shards  */}
<section className="space-y-sm">
<h4 className="font-section-header text-section-header text-on-surface">Active Shards</h4>
<div className="space-y-xs">
{/*  Shard 1  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl">
<div className="flex justify-between items-center mb-sm">
<div>
<p className="font-label-medium text-on-surface">US-East</p>
<p className="font-caption text-caption text-on-surface-variant">Primary Cluster</p>
</div>
<div className="text-right">
<p className="font-section-header text-primary">64%</p>
<p className="text-[10px] text-primary uppercase font-bold">Load</p>
</div>
</div>
<div className="flex gap-sm">
<div className="flex-1 bg-surface-container-highest h-1.5 rounded-full self-center">
<div className="bg-primary h-full w-[64%] rounded-full shadow-[0_0_8px_rgba(255,179,177,0.3)]"></div>
</div>
<button className="bg-surface-bright text-on-surface text-xs font-bold px-3 py-1 rounded-lg hover:bg-tertiary-container transition-colors">Defragment</button>
</div>
</div>
{/*  Shard 2  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl">
<div className="flex justify-between items-center mb-sm">
<div>
<p className="font-label-medium text-on-surface">EU-Central</p>
<p className="font-caption text-caption text-on-surface-variant">Replica Set 02</p>
</div>
<div className="text-right">
<p className="font-section-header text-tertiary">22%</p>
<p className="text-[10px] text-tertiary uppercase font-bold">Load</p>
</div>
</div>
<div className="flex gap-sm">
<div className="flex-1 bg-surface-container-highest h-1.5 rounded-full self-center">
<div className="bg-tertiary h-full w-[22%] rounded-full shadow-[0_0_8px_rgba(111,216,200,0.3)]"></div>
</div>
<button className="bg-surface-bright text-on-surface text-xs font-bold px-3 py-1 rounded-lg hover:bg-tertiary-container transition-colors">Defragment</button>
</div>
</div>
{/*  Shard 3  */}
<div className="bg-surface-container border border-outline-variant p-md rounded-xl">
<div className="flex justify-between items-center mb-sm">
<div>
<p className="font-label-medium text-on-surface">AP-South</p>
<p className="font-caption text-caption text-on-surface-variant">Global Edge</p>
</div>
<div className="text-right">
<p className="font-section-header text-on-surface">88%</p>
<p className="text-[10px] text-error uppercase font-bold">Critical Load</p>
</div>
</div>
<div className="flex gap-sm">
<div className="flex-1 bg-surface-container-highest h-1.5 rounded-full self-center">
<div className="bg-error h-full w-[88%] rounded-full"></div>
</div>
<button className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-lg transition-colors">Defragment</button>
</div>
</div>
</div>
</section>
{/*  Table Optimization  */}
<section className="space-y-sm">
<h4 className="font-section-header text-section-header text-on-surface">Table Optimization</h4>
<div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
<table className="w-full text-left">
<thead className="bg-surface-container-high border-b border-outline-variant">
<tr>
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase">Table</th>
<th className="px-md py-sm font-caption text-caption text-on-surface-variant uppercase">Health</th>
<th className="px-md py-sm text-right"></th>
</tr>
</thead>

<tbody className="divide-y divide-outline-variant">
  {stats?.tables?.map((table: any) => (
    <tr key={table.name} className="hover:bg-surface-bright transition-colors">
      <td className="px-md py-md font-body-compact">{table.name}</td>
      <td className="px-md py-md">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${table.status === 'Optimal' ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'}`}>
          {table.status}
        </span>
      </td>
      <td className="px-md py-md text-right">
        <button onClick={() => handleOptimize(table.name)} className="text-primary font-bold text-xs uppercase tracking-tight">
          {table.status === 'Optimal' ? 'Re-index' : 'Repair'}
        </button>
      </td>
    </tr>
  ))}
</tbody>

</table>
</div>
</section>
{/*  Slow Query Log  */}
<section className="space-y-sm">
<div className="flex justify-between items-center">
<h4 className="font-section-header text-section-header text-on-surface">Slow Query Log</h4>
<span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant font-mono">THR: 100ms</span>
</div>

<div className="bg-surface-container-lowest border border-outline-variant rounded-xl h-40 overflow-y-auto custom-scrollbar p-sm space-y-sm">
  {stats?.slowQueries?.map((q: any, i: number) => (
    <div key={i} className={`border-l-2 ${q.critical ? 'border-error' : 'border-primary'} pl-md py-xs bg-surface-container/50`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`font-mono text-[11px] ${q.critical ? 'text-error' : 'text-primary'}`}>{q.query}</span>
        <span className="font-mono text-[11px] text-on-surface bg-surface-container-highest px-1">{q.time}</span>
      </div>
      <p className="font-caption text-[10px] text-on-surface-variant">Captured {q.ago} • PID: {q.pid}</p>
    </div>
  ))}
</div>
</section>

</main>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container border-t border-outline-variant z-50">
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined" data-icon="storefront">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1">
<span className="material-symbols-outlined" data-icon="health_metrics">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</div>
<div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-3 py-1">
<span className="material-symbols-outlined" data-icon="settings" >settings</span>
<span className="font-label-medium text-label-medium">System</span>
</div>
</nav>


    </div>
  );
}
