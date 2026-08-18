"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function VendorsManagementPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'local' | 'enterprise' | 'pending'>('all');

  useEffect(() => {
    superAdminFetch('/admin/vendors').then((res) => {
      if (res.success) setVendors(res.data);
    }).catch(console.error);
  }, []);

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    const res = await superAdminFetch(`/admin/vendors/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified: !currentStatus }) // the current endpoint just updates to true or toggles, let's look at admin.routes.ts later. The endpoint currently just verifies it? Let's check.
    });
    // For now we'll just refetch or manually update state.
    if (res.success) {
      setVendors(prev => prev.map(v => v.id === id ? { ...v, isVerified: res.data.isVerified } : v));
    }
  };

  const filteredVendors = vendors.filter(v => {
    if (filter === 'pending') return !v.isVerified;
    if (filter === 'local') return v.category === 'restaurant' || v.category === 'grocery';
    if (filter === 'enterprise') return v.category === 'pharmacy' || v.category === 'other';
    return true;
  });

  const pendingCount = vendors.filter(v => !v.isVerified).length;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Sidebar (Desktop Anchor)  */}
<aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] bg-surface-container border-r border-surface-variant flex-col z-[60]">
<div className="h-16 flex items-center px-6 border-b border-surface-variant">
<span className="font-screen-title text-primary tracking-tight">Doorli Admin</span>
</div>
<nav className="flex-1 py-4 px-3 space-y-1">
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-xl transition-colors" href="/vendors-management">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/user-management">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/global-orders-finalized">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="/system-settings-profile">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>
<div className="p-4 border-t border-surface-variant">
<div className="flex items-center gap-3 px-2">
<div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">SA</div>
<div className="flex flex-col">
<span className="text-xs font-bold">Admin User</span>
<span className="text-[10px] text-on-surface-variant">Super Admin</span>
</div>
</div>
</div>
</aside>
{/*  Top App Bar  */}
<header className="bg-background sticky top-0 z-50 flex justify-between items-center px-margin-mobile h-16 w-full border-b border-surface-variant md:px-margin-desktop">
<div className="flex items-center gap-4">
<button className="md:hidden text-primary">
<span className="material-symbols-outlined">menu</span>
</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Vendors</h1>
</div>
<div className="flex items-center gap-3">
<button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container-high rounded-full transition-colors">
<span className="material-symbols-outlined">notifications</span>
</button>
<div className="w-8 h-8 rounded-full bg-surface-container border border-surface-variant hidden md:block">
<img className="w-full h-full rounded-full object-cover" data-alt="A professional headshot of a corporate technology administrator in a minimalist setting. High-quality portrait lighting, deep dark background, crisp details, professional and authoritative tone in a modern tech environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFNMi6KKf51kfXzqaaVAoNTvXwhkqGywX55KfG2fQ3Xbf9XCTekbv_m6FAHXXPSyeplzoJ2wcRMe1LsirNpsNQGNhcqYJe0f5Egt2RcPhc-TtzTE7yGcJulskEFOhpd2dHN75CEFBmtlXT1Iz_ZWRijqscF3er1Xsdstix1YykAcHI6v-oCdFCUjcWxssJAR6K4_amMHKEM-bGRRszuoKSb8_HFHmyZz3j98tbU6IrtwxPvghLXfryQKYUmb3oTbiO0ancshjftBJ1" />
</div>
</div>
</header>
{/*  Main Content Canvas  */}
<main className="p-margin-mobile md:p-margin-desktop space-y-6 max-w-container-max mx-auto">
{/*  Search & Filter Area  */}
<section className="flex flex-col md:flex-row md:items-center gap-4">
<div className="relative flex-1">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
<input className="w-full bg-surface-container-low border border-surface-variant rounded-xl py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-secondary transition-all font-body-compact text-body-compact" placeholder="Search vendors by name, ID or location..." type="text" />
</div>
<button className="flex items-center justify-center gap-2 px-6 h-12 bg-surface-container border border-surface-variant rounded-xl hover:bg-surface-container-high transition-colors text-on-surface">
<span className="material-symbols-outlined">tune</span>
<span className="font-label-medium text-label-medium">Filters</span>
</button>
</section>
{/*  Segmented Controls (Tabs)  */}
<nav className="flex border-b border-surface-variant overflow-x-auto scrollbar-hide">
<button onClick={() => setFilter('all')} className={`px-6 py-3 font-label-medium text-label-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>All Vendors</button>
<button onClick={() => setFilter('local')} className={`px-6 py-3 font-label-medium text-label-medium whitespace-nowrap transition-colors ${filter === 'local' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Local</button>
<button onClick={() => setFilter('enterprise')} className={`px-6 py-3 font-label-medium text-label-medium whitespace-nowrap transition-colors ${filter === 'enterprise' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Enterprise</button>
<button onClick={() => setFilter('pending')} className={`px-6 py-3 font-label-medium text-label-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filter === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                Pending 
                <span className="bg-primary-container text-on-primary-container text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
</button>
</nav>
{/*  High-Density Vendor List  */}
<section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
{filteredVendors.map(vendor => (
<div key={vendor.id} className="bg-surface-container border border-surface-variant p-4 rounded-xl vendor-card-hover transition-all flex flex-col gap-4 relative overflow-hidden group">
<div className="flex justify-between items-start">
<div className="flex gap-3">
<div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-surface-variant overflow-hidden">
<img className="w-full h-full object-cover" data-alt={vendor.businessName} src={vendor.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendor.businessName)}&backgroundColor=000000`} />
</div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<h3 className="font-section-header text-on-surface truncate max-w-[150px]">{vendor.businessName}</h3>
{vendor.isVerified && <span className="material-symbols-outlined text-secondary text-base">verified</span>}
</div>
<span className="text-caption font-caption text-on-surface-variant truncate max-w-[150px]">ID: {vendor.id.slice(0, 8).toUpperCase()}</span>
</div>
</div>
<div className="flex flex-col items-end gap-2">
<span className={`${vendor.isOpen ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>{vendor.isOpen ? 'Open' : 'Closed'}</span>
<div className="flex gap-2 mt-2">
  <button onClick={() => toggleVerify(vendor.id, vendor.isVerified)} className="p-1.5 hover:bg-surface-container-highest rounded-lg text-secondary transition-colors" title={vendor.isVerified ? "Unverify" : "Verify"}>
    <span className="material-symbols-outlined text-base">{vendor.isVerified ? 'verified_user' : 'gpp_bad'}</span>
  </button>
  <button className="p-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-base">info</span></button>
</div>
</div>
</div>
<div className="grid grid-cols-2 gap-3 pt-2">
<div className="flex flex-col gap-1">
<span className="text-[10px] uppercase text-outline font-bold tracking-widest">Category</span>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-sm text-secondary">category</span>
<span className="text-label-medium font-label-medium capitalize">{vendor.category}</span>
</div>
</div>
<div className="flex flex-col gap-1">
<span className="text-[10px] uppercase text-outline font-bold tracking-widest">Rating</span>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-sm text-primary">star</span>
<span className="text-label-medium font-label-medium">{Number(vendor.avgRating).toFixed(1)}</span>
</div>
</div>
</div>
<div className="mt-auto pt-3 border-t border-surface-variant flex justify-between items-center">
<span className="text-caption font-caption text-on-surface-variant">Reviews: {vendor.totalReviews}</span>
<div className="flex items-center gap-3"><a href={`/vendor-detail?id=${vendor.id}`} className="text-secondary hover:underline font-label-medium text-label-medium">Manage</a><a href={`/vendor-erp-access?id=${vendor.id}`} className="text-primary hover:underline font-label-medium text-label-medium">ERP access</a></div>
</div>
</div>
))}

{filteredVendors.length === 0 && (
<div className="bg-surface-container border border-surface-variant border-dashed p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-full min-h-[160px] col-span-full">
<span className="material-symbols-outlined text-4xl text-outline-variant">hourglass_empty</span>
<span className="text-on-surface-variant font-label-medium text-label-medium">No vendors found.</span>
</div>
)}
</section>
</main>
{/*  Floating Action Button (FAB)  */}
<button className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-[70] hover:brightness-110">
<span className="material-symbols-outlined text-3xl">add</span>
</button>
{/*  Bottom Nav Bar (Mobile Only)  */}
<nav className="md:hidden fixed bottom-0 w-full h-16 bg-surface-container border-t border-surface-variant flex justify-around items-center px-2 pb-safe z-50"><a className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1" href="/dashboard"><span className="material-symbols-outlined">dashboard</span><span className="font-label-medium text-label-medium">Dashboard</span></a><a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1" href="/vendors-management"><span className="material-symbols-outlined">store</span><span className="font-label-medium text-label-medium">Vendors</span></a><a className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1" href="/user-management"><span className="material-symbols-outlined">group</span><span className="font-label-medium text-label-medium">Users</span></a><a className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1" href="/global-orders-finalized"><span className="material-symbols-outlined">shopping_cart</span><span className="font-label-medium text-label-medium">Orders</span></a><a className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1" href="/system-settings-profile"><span className="material-symbols-outlined">more_horiz</span><span className="font-label-medium text-label-medium">More</span></a></nav>




    </div>
  );
}
