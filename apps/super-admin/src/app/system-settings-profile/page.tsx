"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function SystemSettingsProfilePage() {

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      superAdminFetch('/admin/api-keys'),
      superAdminFetch('/admin/diagnostics').catch(() => ({ success: false, data: {} })),
    ]).then(([keysRes, diagRes]) => {
      if (keysRes.success) setApiKeys(keysRes.data);
      if (diagRes.success) setConfig(diagRes.data);
      setLoading(false);
    });
  }, []);

  const handleGenerateKey = async () => {
    setGenerating(true);
    const res = await superAdminFetch('/admin/api-keys', { method: 'POST' });
    if (res.success) {
      setApiKeys([{
        id: 'new_' + Date.now(),
        name: 'New Key',
        prefix: res.data.key,
        createdAt: new Date().toISOString(),
        lastUsed: 'Never'
      }, ...apiKeys]);
      alert('Key generated: ' + res.data.key);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Navigation Drawer (Desktop)  */}
<aside className="hidden md:flex h-full w-64 flex-col p-sm space-y-base bg-surface-container-low border-r border-outline-variant shadow-xl transition-all duration-200">
<div className="flex items-center space-x-sm p-md mb-lg">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                DA
            </div>
<div>
<div className="font-screen-title text-screen-title font-bold text-primary">Doorli Admin</div>
<div className="font-label-medium text-label-medium text-on-surface-variant">Super User</div>
</div>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">System Logs</span>
</a>
{/*  Active State  */}
<a className="flex items-center space-x-3 p-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg shadow-sm" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-body-main text-body-main">System Settings</span>
</a>
</nav>
<div className="pt-sm border-t border-outline-variant">
<div className="px-3 py-2 text-on-surface-variant font-caption text-caption uppercase tracking-wider">v{config?.version ?? '2.4.0'}</div>
<a className="flex items-center space-x-3 p-3 text-error hover:bg-error-container/20 rounded-lg transition-colors" href="#">
<span className="material-symbols-outlined">logout</span>
<span className="font-body-main text-body-main">Sign Out</span>
</a>
</div>
</aside>
{/*  Main Content Area  */}
<main className="flex-1 flex flex-col relative overflow-hidden bg-background">
{/*  Top App Bar  */}
<header className="fixed top-0 w-full md:relative z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full bg-background border-b border-outline-variant transition-colors duration-200">
<div className="flex items-center space-x-md">
<span className="material-symbols-outlined text-primary">grid_view</span>
<h1 className="font-screen-title-mobile md:font-screen-title text-screen-title-mobile md:text-screen-title font-bold text-primary">System Settings</h1>
</div>
<div className="flex items-center space-x-lg">
<div className="hidden md:block text-right">
<div className="font-label-medium text-label-medium text-on-surface-variant">Network Status</div>
<div className="font-caption text-caption text-tertiary flex items-center justify-end">
<span className="w-2 h-2 rounded-full bg-tertiary mr-1 animate-pulse"></span>
                        Optimal
                    </div>
</div>
<div className="w-10 h-10 rounded-full border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a senior system administrator in a high-tech dark environment. The lighting is dramatic, with cool blue and sharp red rim lights reflecting off modern glass surfaces. The person is looking directly at the camera with a confident, authoritative expression, embodying the persona of a 'Super Admin' for an enterprise command center." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeu4NMRVnSFrwD5x6XI_xELyV2gSzwgvO84eAUgsv-Xvt6H03OYyapuRXutMxgA1B2Y_4oJWLd9E_lH7JZ-EX-y-ZRp2lUYTWqgTWqbbDcfJyNS_4oXpEHOPSyt4BEZW8lp-n6IYOqSGLU9cqJhbx02_VrXLhburyDaGruVbhN_ByGlt7g9eB2YRkWl3cAZxrxkLjSPRpyoFp4uMJie8knRqso8odiugGAMCrg-w5E3vI-ylK_RqbNm4lNmQtKnbsDLKXbBjsADM_w"/>
</div>
</div>
</header>
{/*  Content Scrollable View  */}
<div className="flex-1 overflow-y-auto custom-scrollbar pt-20 md:pt-0 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop">
<div className="max-w-6xl mx-auto mt-lg">
<div className="bento-grid">
{/*  Global System Settings  */}
<section className="col-span-12 md:col-span-8 space-y-md">
<div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
<h2 className="font-section-header text-section-header text-primary mb-md flex items-center">
<span className="material-symbols-outlined mr-sm">public</span> Global System Controls
                            </h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="space-y-base">
<label className="font-label-medium text-label-medium text-on-surface-variant">System Language</label>
<div className="relative">
<select className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl p-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none appearance-none font-body-compact text-body-compact">
<option>English (US) - Default</option>
<option>German (DE)</option>
<option>Mandarin (CN)</option>
<option>Spanish (ES)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
</div>
</div>
<div className="space-y-base">
<label className="font-label-medium text-label-medium text-on-surface-variant">Timezone Synchronization</label>
<div className="relative">
<select className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl p-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none appearance-none font-body-compact text-body-compact">
<option>UTC (Coordinated Universal Time)</option>
<option>EST (Eastern Standard Time)</option>
<option>PST (Pacific Standard Time)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">schedule</span>
</div>
</div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
<h2 className="font-section-header text-section-header text-primary mb-md flex items-center">
<span className="material-symbols-outlined mr-sm">notifications_active</span> Notification &amp; Reporting
                            </h2>
<div className="space-y-sm">
<div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 hover:border-outline transition-colors">
<div className="flex items-center space-x-md">
<span className="material-symbols-outlined text-secondary">mail</span>
<div>
<div className="font-body-main text-body-main">Critical Error Alerts</div>
<div className="font-caption text-caption text-on-surface-variant">Immediate email dispatch for system outages</div>
</div>
</div>
<div className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox"/>
<div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
<div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 hover:border-outline transition-colors">
<div className="flex items-center space-x-md">
<span className="material-symbols-outlined text-tertiary">analytics</span>
<div>
<div className="font-body-main text-body-main">Weekly Performance Digest</div>
<div className="font-caption text-caption text-on-surface-variant">Aggregated KPI report sent every Monday</div>
</div>
</div>
<div className="relative inline-flex items-center cursor-pointer">
<input className="sr-only peer" type="checkbox"/>
<div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
</div>
</div>
{/*  API Keys Section  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
<div className="flex items-center justify-between mb-md">
<h2 className="font-section-header text-section-header text-primary flex items-center">
<span className="material-symbols-outlined mr-sm">key</span> API Infrastructure
                                </h2>
<button className="px-sm py-1 bg-secondary-container text-on-secondary-container font-label-medium text-label-medium rounded-lg hover:brightness-110 transition-all">
                                    + Generate New Key
                                </button>
</div>
<div className="space-y-sm">

  {apiKeys.map(key => (
    <div key={key.id} className="bg-surface-container-low border border-outline-variant rounded-lg p-3 mb-3">
      <div className="flex justify-between items-start mb-base">
        <div>
          <div className="font-body-main text-body-main font-bold">{key.name}</div>
          <div className="font-caption text-caption text-on-surface-variant">Last used: {new Date(key.lastUsed).toLocaleDateString()}</div>
        </div>
        <span className="bg-tertiary/20 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Active</span>
      </div>
      <div className="flex items-center bg-background rounded p-2 mt-sm border border-outline-variant/30">
        <code className="flex-1 font-mono text-[11px] text-primary truncate">{key.prefix}************************</code>
        <button onClick={() => alert('Copied ' + key.prefix)} className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary ml-2">content_copy</button>
      </div>
    </div>
  ))}

</div>
<a className="mt-md block text-center font-label-medium text-label-medium text-secondary hover:underline underline-offset-4" href="#">
                                View Full API Documentation <span className="material-symbols-outlined align-middle text-sm">open_in_new</span>
</a>
</div>
</section>
{/*  Sidebar Stats & Legal  */}
<aside className="col-span-12 md:col-span-4 space-y-md">
{/*  Security Status Widget  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm relative overflow-hidden group">
<div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
<span className="material-symbols-outlined text-[120px]" >security</span>
</div>
<h3 className="font-label-medium text-label-medium text-on-surface-variant mb-base uppercase tracking-widest">Security Level</h3>
<div className="font-kpi-number text-kpi-number text-tertiary mb-sm">{config?.securityLevel ?? 'ENCRYPTED'}</div>
<div className="space-y-sm">
<div className="flex items-center justify-between text-xs">
<span className="text-on-surface-variant">2FA Enforcement</span>
<span className="text-tertiary font-bold">{config?.twoFactorStatus ?? 'ACTIVE'}</span>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full rounded-full" style={{ width: `${config?.twoFactorEnforcementPercent ?? 85}%` }}></div>
</div>
<p className="font-caption text-caption text-on-surface-variant leading-tight">
                                    {config?.securityAuditInfo ?? 'System is operating under strict security protocols. Last audit: 4 hours ago.'}
                                </p>
</div>
</div>
{/*  Help & Documentation  */}
<div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
<div className="p-md border-b border-outline-variant">
<h3 className="font-section-header text-section-header">Resources</h3>
</div>
<div className="flex flex-col">
<a className="p-md flex items-center justify-between hover:bg-surface-container-high transition-colors" href="#">
<span className="font-body-main text-body-main flex items-center">
<span className="material-symbols-outlined mr-sm text-secondary">description</span> Documentation
                                    </span>
<span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
</a>
<a className="p-md flex items-center justify-between hover:bg-surface-container-high border-t border-outline-variant transition-colors" href="#">
<span className="font-body-main text-body-main flex items-center">
<span className="material-symbols-outlined mr-sm text-secondary">support_agent</span> Technical Support
                                    </span>
<span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
</a>
<a className="p-md flex items-center justify-between hover:bg-surface-container-high border-t border-outline-variant transition-colors" href="#">
<span className="font-body-main text-body-main flex items-center">
<span className="material-symbols-outlined mr-sm text-secondary">history_edu</span> Change Log
                                    </span>
<span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
</a>
</div>
</div>
{/*  Legal Info  */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
<div className="flex flex-col space-y-sm">
<div className="flex justify-between items-center">
<span className="font-caption text-caption text-on-surface-variant">Version</span>
<span className="font-label-medium text-label-medium text-on-surface">{config?.version ?? '2.4.0-build_732'}</span>
</div>
<div className="flex justify-between items-center">
<span className="font-caption text-caption text-on-surface-variant">License</span>
<span className="font-label-medium text-label-medium text-on-surface">{config?.license ?? 'Enterprise Pro'}</span>
</div>
<div className="flex justify-between items-center">
<span className="font-caption text-caption text-on-surface-variant">Updated</span>
<span className="font-label-medium text-label-medium text-on-surface">{config?.lastUpdated ?? 'Oct 24, 2023'}</span>
</div>
<div className="pt-sm space-x-md">
<a className="font-caption text-caption text-secondary hover:underline" href="#">Privacy Policy</a>
<a className="font-caption text-caption text-secondary hover:underline" href="#">Terms of Use</a>
</div>
</div>
</div>
</aside>
</div>
{/*  Footer Sign Out (Mobile and Desktop)  */}
<div className="mt-xl flex flex-col items-center justify-center space-y-md">
<button className="group flex items-center space-x-3 px-xl py-md bg-on-error-container text-on-error border border-error/30 rounded-xl hover:bg-error-container transition-all scale-100 active:scale-95 shadow-lg" onClick={() => {}}>
<span className="material-symbols-outlined group-hover:rotate-180 transition-transform">logout</span>
<span className="font-section-header text-section-header">Sign Out of Session</span>
</button>
<p className="font-caption text-caption text-on-surface-variant opacity-50">
                        © 2024 Doorli Ecosystems Inc. All Rights Reserved.
                    </p>
</div>
</div>
</div>
{/*  Bottom Navigation Bar (Mobile only)  */}
<nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container border-t border-outline-variant shadow-lg z-50">
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-label-medium">Health</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-4 py-1 transition-transform scale-95 active:scale-90" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</a>
</nav>
</main>


    </div>
  );
}
