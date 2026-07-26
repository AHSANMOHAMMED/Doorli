"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function GlobalOrdersFinalizedPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, avgProcessing: '8.4m', alerts: 0 });

  useEffect(() => {
    superAdminFetch('/admin/orders').then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        const pending = res.data.filter((o: any) => o.status === 'pending').length;
        setStats(s => ({ ...s, total: res.data.length, pending }));
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar Shell  */}
<header className="bg-background dark:bg-background text-primary dark:text-primary font-screen-title-mobile text-screen-title-mobile w-full top-0 sticky border-b border-surface-variant dark:border-surface-variant transition-colors duration-200 flex justify-between items-center px-margin-mobile h-16 w-full z-50">
<div className="flex items-center gap-md">
<button className="material-symbols-outlined hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors duration-200 p-2 rounded-full">menu</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Super Admin</h1>
</div>
<div className="flex items-center gap-md">
<button className="material-symbols-outlined hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors duration-200 p-2 rounded-full">notifications</button>
<div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border border-outline-variant overflow-hidden">
<img alt="Admin Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoasyfNvsK0cbEGKmmdZF966ZdHbx2uqEKCcN7_eoiVoBwvDdP2Mh07WbnJecNBSUAxwPGOAi-oZwL5NbVHUW5Rbuhax-ZRGZKG4J-zAhhdsFHdhS78-YBNp1tuetHvuPAwYKNkIKU4NT0sKhj_o4duEiLhmX_dUwXGWxnphkjSWTqj6vcuyRgtXrxCyg2DYU5gR30i2i5ndHWqvta9PhPJhTKzZtO7p-cAz1eVYOWdgwMknXgko-OPqwfWhxyETQ4Ig_42SCrhlmb"/>
</div>
</div>
</header>
<div className="flex pt-16 min-h-screen">
{/*  NavigationDrawer Shell (Desktop Only)  */}
<aside className="hidden md:flex h-[calc(100vh-64px)] w-64 bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant dark:border-outline-variant flex-col p-sm space-y-base sticky top-16">
<div className="flex items-center p-md gap-md mb-md">
<div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-fixed">
<span className="material-symbols-outlined">shield_person</span>
</div>
<div>
<p className="font-section-header text-on-surface font-bold">Doorli Admin</p>
<p className="text-caption text-on-surface-variant">Super User</p>
</div>
</div>
<nav className="flex-1 space-y-1">
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">terminal</span> Command Center
                </a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">sync_alt</span> ERP Integration
                </a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">group</span> User Management
                </a>
<a className="flex items-center px-md py-sm bg-secondary-container dark:bg-secondary-container text-on-secondary-container dark:text-on-secondary-container font-bold rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">receipt_long</span> Orders Feed
                </a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">campaign</span> Broadcasts
                </a>
<a className="flex items-center px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200 font-body-main" href="#">
<span className="material-symbols-outlined mr-md">help_outline</span> Support
                </a>
</nav>
<div className="p-md border-t border-outline-variant">
<div className="flex items-center justify-between text-caption text-on-surface-variant">
<span>v2.4.0</span>
<span className="material-symbols-outlined text-sm">settings</span>
</div>
</div>
</aside>
{/*  Main Content Canvas  */}
<main className="flex-1 px-4 md:px-8 py-8 overflow-y-auto mb-20 md:mb-0">
{/*  Feed Header & Controls  */}
<div className="max-w-container-max mx-auto space-y-8">
<header className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<p className="text-primary font-label-medium uppercase tracking-widest mb-xs">System Oversight</p>
<h2 className="font-screen-title text-screen-title text-on-surface">Global Orders Feed</h2>
</div>
<div className="flex items-center gap-sm">
<span className="px-3 py-1 bg-tertiary/20 text-tertiary rounded-full text-caption border border-tertiary/30 flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                            Live Monitoring
                        </span>
<button className="bg-surface-container-high hover:bg-surface-bright text-primary border border-outline-variant px-lg py-sm rounded-xl font-label-medium flex items-center gap-2 transition-all">
<span className="material-symbols-outlined">download</span> Export Daily Report
</button>
</div>
</header>
{/*  Filter Bar  */}
<section className="grid grid-cols-1 md:grid-cols-4 gap-sm bg-surface-container p-sm rounded-xl border border-outline-variant">
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-md">filter_list</span>
<select className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-on-surface-variant font-label-medium focus:ring-1 focus:ring-primary appearance-none">
<option>Status: All Orders</option>
<option>Processing</option>
<option>Delivered</option>
<option>Cancelled</option>
</select>
</div>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-md">storefront</span>
<select className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-on-surface-variant font-label-medium focus:ring-1 focus:ring-primary appearance-none">
<option>Vendor: All Entities</option>
<option>HyperStore Alpha</option>
<option>Global Logistics Corp</option>
<option>Metro Express</option>
</select>
</div>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-md">hub</span>
<select className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-on-surface-variant font-label-medium focus:ring-1 focus:ring-primary appearance-none">
<option>Type: Hybrid View</option>
<option>Local Network</option>
<option>ERP External</option>
</select>
</div>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-md">search</span>
<input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-on-surface-variant font-label-medium focus:ring-1 focus:ring-primary" placeholder="Search ID or Customer..." type="text"/>
</div>
</section>
{/*  KPI Quick View  */}
<section className="grid grid-cols-2 md:grid-cols-4 gap-md">
<div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
<p className="text-caption text-on-surface-variant">Active Today</p>
<h4 className="font-kpi-number text-kpi-number text-on-surface">{stats.total}</h4>
<p className="text-caption text-tertiary mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs">trending_up</span> +12%
                        </p>
</div>
<div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
<p className="text-caption text-on-surface-variant">Pending Sync</p>
<h4 className="font-kpi-number text-kpi-number text-secondary">{stats.pending}</h4>
<p className="text-caption text-secondary mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs">sync</span> ERP Auto-Queue
                        </p>
</div>
<div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
<p className="text-caption text-on-surface-variant">Avg. Processing</p>
<h4 className="font-kpi-number text-kpi-number text-on-surface">{stats.avgProcessing}</h4>
<p className="text-caption text-on-surface-variant mt-1">Platform Average</p>
</div>
<div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
<p className="text-caption text-on-surface-variant">Risk Alerts</p>
<h4 className="font-kpi-number text-kpi-number text-error">{stats.alerts}</h4>
<p className="text-caption text-error mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs">warning</span> Requires Action
                        </p>
</div>
</section>
{/*  Orders Feed (Infinite Scroll List)  */}
<section className="space-y-sm" id="orders-feed">
{/*  Table Header  */}
<div className="hidden md:grid grid-cols-12 px-md py-sm bg-surface-container rounded-t-lg border-x border-t border-outline-variant text-caption text-on-surface-variant uppercase tracking-wider font-bold">
<div className="col-span-2">Order ID</div>
<div className="col-span-2">Status</div>
<div className="col-span-3">Vendor / Location</div>
<div className="col-span-2">Amount</div>
<div className="col-span-2">Type</div>
<div className="col-span-1 text-right">Actions</div>
</div>
{/*  Feed Items  */}
<div className="space-y-2" id="infinite-list-container">
  {orders.map((order) => (
    <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 items-center px-md py-md md:py-sm bg-surface-container-low border border-outline-variant rounded-xl order-card-hover transition-all duration-200 cursor-pointer">
      <div className="col-span-2 flex items-center gap-sm">
        <span className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-error' : order.status === 'delivered' ? 'bg-tertiary' : 'bg-secondary'} animate-pulse mr-2`}></span>
        <div className="md:hidden text-caption text-on-surface-variant">ID:</div>
        <span className="font-bold text-on-surface uppercase">{order.orderNumber}</span>
      </div>
      <div className="col-span-2 py-2 md:py-0">
        <span className={`px-3 py-1 ${order.status === 'delivered' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary-container text-on-secondary-container'} text-caption rounded-full flex items-center w-fit gap-1`}>
          <span className="material-symbols-outlined text-[14px]">
            {order.status === 'delivered' ? 'check_circle' : 'local_shipping'}
          </span>
          {order.status}
        </span>
      </div>
      <div className="col-span-3 flex flex-col">
        <span className="text-on-surface font-medium">{order.vendor?.businessName || 'Unknown Vendor'}</span>
        <span className="text-caption text-on-surface-variant capitalize">Customer: {order.customer?.fullName}</span>
      </div>
      <div className="col-span-2 py-2 md:py-0">
        <span className="font-bold text-on-surface">${Number(order.totalAmount).toFixed(2)}</span>
        <p className="text-caption text-on-surface-variant">{new Date(order.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="col-span-2">
        <span className="flex items-center gap-1 text-on-surface-variant text-caption bg-surface-container px-2 py-1 rounded-md w-fit">
          <span className="material-symbols-outlined text-[14px]">
            {order.erpOrderId ? 'cloud_sync' : 'lan'}
          </span>
          {order.erpOrderId ? 'ERP Integrated' : 'Local Network'}
        </span>
      </div>
      <div className="col-span-1 text-right flex justify-end gap-sm">
        <a href={`/order-detail?id=${order.id}`} className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></a>
        <button className="p-1 hover:text-error transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
      </div>
    </div>
  ))}
  
  {orders.length === 0 && (
    <div className="text-center py-8 text-on-surface-variant">No orders found.</div>
  )}
</div>
{/*  Loading Indicator for Infinite Scroll  */}
<div className="flex justify-center py-xl" id="scroll-loader">
<div className="flex items-center gap-2 text-on-surface-variant font-label-medium">
<svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
<path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
</svg>
                            Syncing next batch...
                        </div>
</div>
</section>
</div>
</main>
</div>
{/*  BottomNavBar Shell (Mobile Only)  */}
<nav className="md:hidden bg-surface-container dark:bg-surface-container font-label-medium text-label-medium fixed bottom-0 w-full z-50 border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 w-full px-2 pb-safe">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">store</span>
<span>Vendors</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">group</span>
<span>Users</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">shopping_cart</span>
<span>Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">more_horiz</span>
<span>More</span>
</a>
</nav>


    </div>
  );
}
