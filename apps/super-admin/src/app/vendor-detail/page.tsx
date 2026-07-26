"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function VendorDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    if (id) {
      superAdminFetch(`/admin/vendors/${id}`).then((res) => {
        if (res.success) setVendor(res.data);
      }).catch(console.error);
    }
  }, [id]);

  const toggleVerify = async () => {
    if (!vendor) return;
    const res = await superAdminFetch(`/admin/vendors/${vendor.id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified: !vendor.isVerified })
    });
    if (res.success) setVendor(res.data);
  };

  if (!vendor) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><p className="text-white">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  NavigationDrawer (Shared)  */}
<aside className="hidden md:flex flex-col p-sm space-y-base h-full w-64 bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant dark:border-outline-variant shadow-xl">
<div className="p-md mb-lg">
<h1 className="font-screen-title text-screen-title font-bold text-primary">Doorli Admin</h1>
<p className="text-on-surface-variant font-caption text-caption">Super User • v2.4.0</p>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center px-4 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">storefront</span>
<span className="font-body-main text-body-main">Vendors</span>
</a>
<a className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">receipt_long</span>
<span className="font-body-main text-body-main">Orders</span>
</a>
<a className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#">
<span className="material-symbols-outlined mr-3">help_outline</span>
<span className="font-body-main text-body-main">Support</span>
</a>
</nav>
<div className="mt-auto p-md border-t border-outline-variant flex items-center space-x-3">
<div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">SA</div>
<div>
<p className="font-label-medium text-label-medium text-on-surface">Admin User</p>
<p className="font-caption text-caption text-on-surface-variant">Global Access</p>
</div>
</div>
</aside>
{/*  Main Content Area  */}
<main className="flex-1 flex flex-col min-w-0 relative h-full">
{/*  TopAppBar (Shared)  */}
<header className="fixed top-0 w-full z-40 bg-background flex justify-between items-center px-margin-mobile h-16 border-b border-outline-variant md:relative md:w-auto">
<div className="flex items-center space-x-4">
<button className="text-primary"><span className="material-symbols-outlined">grid_view</span></button>
<h2 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Vendor Details</h2>
</div>
<div className="flex items-center space-x-md">
<div className="hidden sm:flex flex-col items-end mr-sm">
<span className="font-label-medium text-label-medium text-primary">System Online</span>
<span className="font-caption text-caption text-tertiary">Lat: 24ms</span>
</div>
<div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Close-up professional headshot of a corporate super administrator for a high-tech portal, wearing modern glasses, neutral background, cinematic lighting with subtle blue and red accents to match the Doorli brand identity, high-end digital photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_gfEOU3cg5jPK6WMhQPYDaoInor1n0Jub323tp10QV6W3Z8c8_ygSXyguO7P7Q_CD9iPBW4wWASVFaREVcWKZWmBH9Jw0ZDkSWbN_uA6FPlIYgm9_ex2JbugQdecrvWqQnBN4L8xK96KyPXloCLzY4GXYZ1ptqZ5LcByBPJFA3XztsmQwTX9iFAiy_XbC2CBYCRj77t4kIWO-qDnTt04Mix__DYJwytAl4SLfjqBoL0Wd5q_FF8eEHMbKbZY0uxraLQsTaKtBlNms"/>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto custom-scrollbar p-margin-mobile md:p-margin-desktop space-y-lg pt-20 md:pt-md">
{/*  Breadcrumbs  */}
<div className="flex items-center space-x-sm text-on-surface-variant font-caption text-caption">
<span>Vendors</span>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<span className="text-primary font-semibold">{vendor.businessName}</span>
</div>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
{/*  Section: Overview (logo, status toggle)  */}
<section className="lg:col-span-4 glass-panel rounded-xl p-md flex flex-col justify-between min-h-[240px]">
<div className="flex items-start justify-between">
<div className="w-20 h-20 bg-surface-container-highest rounded-lg flex items-center justify-center border border-outline-variant overflow-hidden">
<img className="w-full h-full object-contain p-2" data-alt={vendor.businessName} src={vendor.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendor.businessName)}&backgroundColor=000000`}/>
</div>
<div className="flex flex-col items-end">
<label className="relative inline-flex items-center cursor-pointer">
<input checked={vendor.isVerified} onChange={toggleVerify} className="sr-only peer" type="checkbox" />
<div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-background after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
<span className="ml-3 font-label-medium text-label-medium text-on-surface">Verified Status</span>
</label>
<span className={`mt-1 ${vendor.isVerified ? 'active-pill' : 'danger-pill'} px-2 py-0.5 rounded-full font-caption text-caption`}>{vendor.isVerified ? 'Verified' : 'Unverified'}</span>
</div>
</div>
<div className="mt-md">
<h3 className="font-section-header text-section-header text-on-surface">{vendor.businessName}</h3>
<p className="text-on-surface-variant font-body-compact text-body-compact capitalize">{vendor.category}</p>
<div className="flex space-x-md mt-sm">
<div className="flex items-center space-x-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm">location_on</span>
<span className="font-caption text-caption">{vendor.city || 'N/A'}</span>
</div>
<div className="flex items-center space-x-1 text-on-surface-variant">
<span className="material-symbols-outlined text-sm">calendar_today</span>
<span className="font-caption text-caption">Joined {new Date(vendor.createdAt).toLocaleDateString()}</span>
</div>
</div>
</div>
</section>
{/*  Section: ERP Connection  */}
<section className="lg:col-span-8 glass-panel rounded-xl p-md border-l-4 border-l-secondary-container">
<div className="flex items-center justify-between mb-md">
<div className="flex items-center space-x-3">
<div className="w-10 h-10 bg-secondary-container/20 text-secondary rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">sync_alt</span>
</div>
<div>
<h3 className="font-section-header text-section-header text-on-surface">ERP Integration</h3>
<p className="font-caption text-caption text-on-surface-variant">Oracle NetSuite Provisioning</p>
</div>
</div>
<button className="bg-primary-container text-on-primary-fixed hover:opacity-90 px-md py-2 rounded-xl font-label-medium text-label-medium transition-all duration-200">
                            Trigger ERP Provisioning
                        </button>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant">
<p className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-1">erpTenantId</p>
<div className="flex items-center justify-between">
<span className="font-mono text-secondary">SLG-9923-NS-X02</span>
<button className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined text-sm">content_copy</span></button>
</div>
</div>
<div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant">
<p className="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-1">Sync Status</p>
<div className="flex items-center space-x-2">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-medium text-label-medium text-on-surface">Synchronized</span>
<span className="font-caption text-caption text-on-surface-variant ml-auto">Last sync: 2m ago</span>
</div>
</div>
</div>
<div className="mt-md bg-surface-container-lowest/50 p-sm rounded-lg border border-outline-variant/30 overflow-hidden">
<div className="flex justify-between items-center mb-base">
<span className="font-caption text-caption text-on-surface-variant">Data Pipeline Health</span>
<span className="font-caption text-caption text-tertiary">99.8% Success</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full" ></div>
</div>
</div>
</section>
{/*  Section: Vendor Users list  */}
<section className="lg:col-span-5 glass-panel rounded-xl p-md">
<div className="flex items-center justify-between mb-md">
<h3 className="font-section-header text-section-header text-on-surface">Vendor Users</h3>
<span className="bg-surface-container-high px-2 py-0.5 rounded-lg text-on-surface-variant font-caption text-caption">8 Total</span>
</div>
<div className="space-y-sm overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
{/*  User 1  */}
<div className="flex items-center p-sm bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors">
<div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary font-bold mr-md">
  {vendor.user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
</div>
<div className="flex-1">
<p className="font-label-medium text-label-medium text-on-surface">{vendor.user?.fullName || 'Owner'}</p>
<p className="font-caption text-caption text-on-surface-variant">Vendor Admin • {vendor.user?.email || 'N/A'}</p>
</div>
<button className="text-on-surface-variant"><span className="material-symbols-outlined">more_vert</span></button>
</div>
{/*  User 2  */}
<div className="flex items-center p-sm bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors">
<div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary font-bold mr-md">PP</div>
<div className="flex-1">
<p className="font-label-medium text-label-medium text-on-surface">Pepper Potts</p>
<p className="font-caption text-caption text-on-surface-variant">Operations • p.potts@slg.com</p>
</div>
<button className="text-on-surface-variant"><span className="material-symbols-outlined">more_vert</span></button>
</div>
{/*  User 3  */}
<div className="flex items-center p-sm bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors">
<div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold mr-md">HR</div>
<div className="flex-1">
<p className="font-label-medium text-label-medium text-on-surface">Happy Hogan</p>
<p className="font-caption text-caption text-on-surface-variant">Logistics Manager • hogan@slg.com</p>
</div>
<button className="text-on-surface-variant"><span className="material-symbols-outlined">more_vert</span></button>
</div>
{/*  User 4  */}
<div className="flex items-center p-sm bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors">
<div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold mr-md">JR</div>
<div className="flex-1">
<p className="font-label-medium text-label-medium text-on-surface">James Rhodes</p>
<p className="font-caption text-caption text-on-surface-variant">Fleet Security • rhodey@slg.com</p>
</div>
<button className="text-on-surface-variant"><span className="material-symbols-outlined">more_vert</span></button>
</div>
</div>
<button className="w-full mt-md py-2 border border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all font-label-medium text-label-medium">
                        + Add Internal User
                    </button>
</section>
{/*  Section: Orders list  */}
<section className="lg:col-span-7 glass-panel rounded-xl flex flex-col">
<div className="p-md border-b border-outline-variant flex items-center justify-between">
<div>
<h3 className="font-section-header text-section-header text-on-surface">Recent Orders</h3>
<p className="font-caption text-caption text-on-surface-variant">Fulfillment processing from current ERP sync</p>
</div>
<div className="flex space-x-sm">
<button className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg"><span className="material-symbols-outlined text-sm">filter_list</span></button>
<button className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg"><span className="material-symbols-outlined text-sm">download</span></button>
</div>
</div>
<div className="overflow-x-auto flex-1">
<table className="w-full text-left font-body-compact text-body-compact">
<thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
<tr>
<th className="px-md py-sm font-semibold uppercase tracking-wider text-[10px]">Order ID</th>
<th className="px-md py-sm font-semibold uppercase tracking-wider text-[10px]">Client</th>
<th className="px-md py-sm font-semibold uppercase tracking-wider text-[10px]">Status</th>
<th className="px-md py-sm font-semibold uppercase tracking-wider text-[10px]">Amount</th>
<th className="px-md py-sm font-semibold uppercase tracking-wider text-[10px]">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/30">
<tr className="hover:bg-surface-container transition-colors">
<td className="px-md py-md font-mono text-primary text-xs">ORD-4402</td>
<td className="px-md py-md">Wayne Enterprises</td>
<td className="px-md py-md"><span className="active-pill px-2 py-0.5 rounded-full text-[10px]">Dispatched</span></td>
<td className="px-md py-md">$12,450.00</td>
<td className="px-md py-md"><button className="text-secondary hover:underline">View</button></td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-md py-md font-mono text-primary text-xs">ORD-4403</td>
<td className="px-md py-md">LexCorp</td>
<td className="px-md py-md"><span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-[10px]">Pending</span></td>
<td className="px-md py-md">$8,210.50</td>
<td className="px-md py-md"><button className="text-secondary hover:underline">View</button></td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-md py-md font-mono text-primary text-xs">ORD-4404</td>
<td className="px-md py-md">Pym Technologies</td>
<td className="px-md py-md"><span className="active-pill px-2 py-0.5 rounded-full text-[10px]">Dispatched</span></td>
<td className="px-md py-md">$45,000.00</td>
<td className="px-md py-md"><button className="text-secondary hover:underline">View</button></td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-md py-md font-mono text-primary text-xs">ORD-4405</td>
<td className="px-md py-md">Oscorp Inc.</td>
<td className="px-md py-md"><span className="danger-pill px-2 py-0.5 rounded-full text-[10px]">On Hold</span></td>
<td className="px-md py-md">$3,100.20</td>
<td className="px-md py-md"><button className="text-secondary hover:underline">View</button></td>
</tr>
</tbody>
</table>
</div>
<div className="p-sm bg-surface-container-low border-t border-outline-variant flex items-center justify-between font-caption text-caption">
<span className="text-on-surface-variant">Showing 4 of 124 orders</span>
<div className="flex items-center space-x-md">
<button className="hover:text-primary transition-colors">Previous</button>
<span className="text-on-surface">Page 1 of 31</span>
<button className="hover:text-primary transition-colors">Next</button>
</div>
</div>
</section>
{/*  Section: High Density KPI Widgets  */}
<section className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-md pb-20 md:pb-0">
<div className="glass-panel p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-base">MTD Revenue</p>
<div className="flex items-baseline space-x-sm">
<span className="font-kpi-number text-kpi-number text-on-surface">$1.2M</span>
<span className="text-tertiary font-caption text-caption">+12%</span>
</div>
</div>
<div className="glass-panel p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-base">Order Accuracy</p>
<div className="flex items-baseline space-x-sm">
<span className="font-kpi-number text-kpi-number text-on-surface">99.2%</span>
<span className="text-tertiary font-caption text-caption">Stable</span>
</div>
</div>
<div className="glass-panel p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-base">Avg. Sync Lag</p>
<div className="flex items-baseline space-x-sm">
<span className="font-kpi-number text-kpi-number text-on-surface">1.4s</span>
<span className="text-tertiary font-caption text-caption">-0.3s</span>
</div>
</div>
<div className="glass-panel p-md rounded-xl">
<p className="font-label-medium text-label-medium text-on-surface-variant mb-base">Active Drivers</p>
<div className="flex items-baseline space-x-sm">
<span className="font-kpi-number text-kpi-number text-on-surface">142</span>
<span className="text-secondary font-caption text-caption">8 Peak</span>
</div>
</div>
</section>
</div>
</div>
{/*  BottomNavBar (Shared - Mobile Only)  */}
<nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container border-t border-outline-variant shadow-lg z-50">
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-[10px]">Command</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-4 py-1" href="#">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-[10px]">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-[10px]">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#">
<span className="material-symbols-outlined">health_metrics</span>
<span className="font-label-medium text-[10px]">Health</span>
</a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-[10px]">System</span>
</a>
</nav>
</main>


    </div>
  );
}
