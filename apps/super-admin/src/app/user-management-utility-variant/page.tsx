"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserManagementUtilityVariantPage() {

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      superAdminFetch('/admin/users').then(res => {
        if (res.success) setUsers(res.data);
        setLoading(false);
      });
    }, []);
  
    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top App Bar  */}
<header className="fixed top-0 w-full z-50 bg-background text-primary border-b border-outline-variant flex justify-between items-center px-margin-mobile h-16">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-colors">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
<img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3KeO5DFdwD-MULoh4EqoMoEe0LTxyH54tUVLfh397w40Jrnt19Kv2fWD60gS45RtVygEn87_4xxRa7Y-IfRd1t4JTO0crC5OHgUXp_22FIlexV09y5bPsEpyfWSOHlepCPgDPQYrWUqF1aCTpFqrgLugS00P_XFAI_g3z5fRbNB4HHIFdcuu7u-52I4eGlU3ZSZZS83wFGfB8KRbdN92WwprbbU-kH44JQbVeLT2VhbxdSlwTEy4gSIHy2yUbczWOcm2AXYTyoJ7d"/>
</div>
</div>
</header>
<div className="flex pt-16 min-h-screen">
{/*  Navigation Drawer (Desktop Only)  */}
<aside className="hidden md:flex h-full w-64 fixed left-0 bg-surface-container-low border-r border-outline-variant shadow-xl flex-col p-sm space-y-base overflow-y-auto custom-scrollbar z-40">
<div className="px-md py-lg mb-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container">shield_person</span>
</div>
<div>
<p className="font-screen-title text-[16px] font-bold text-primary">Doorli Admin</p>
<p className="font-caption text-caption text-on-surface-variant">Super User • v2.4.0</p>
</div>
</div>
</div>
<nav className="space-y-1">
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/dashboard">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/erp-synchronization-logs">
<span className="material-symbols-outlined">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center gap-3 px-md py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all" href="/user-management">
<span className="material-symbols-outlined" >group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/system-broadcasts">
<span className="material-symbols-outlined">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/erp-synchronization-logs">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">System Logs</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="mailto:support@doorli.me">
<span className="material-symbols-outlined">help_outline</span>
<span className="font-body-main text-body-main">Support</span>
</a>
</nav>
</aside>
{/*  Main Content Canvas  */}
<main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop pb-24">
{/*  Dashboard Header Section  */}
<div className="mb-lg">
<h2 className="font-screen-title text-screen-title mb-1 text-on-background">User Management</h2>
<p className="font-body-compact text-body-compact text-on-surface-variant">Oversee system roles, permissions, and identities.</p>
</div>
{/*  Controls: Search & Segmented Filter  */}
<div className="flex flex-col lg:flex-row gap-md mb-lg items-start lg:items-center justify-between">
<div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant w-full lg:w-auto">
<button className="px-md py-1.5 rounded font-label-medium text-caption text-on-primary-fixed bg-primary-container">All</button>
<button className="px-md py-1.5 rounded font-label-medium text-caption text-on-surface-variant hover:text-on-surface">Staff</button>
<button className="px-md py-1.5 rounded font-label-medium text-caption text-on-surface-variant hover:text-on-surface">Admins</button>
<button className="px-md py-1.5 rounded font-label-medium text-caption text-on-surface-variant hover:text-on-surface">Active</button>
</div>
<div className="relative w-full lg:w-80">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
<input className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-[14px] font-body-main focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline" placeholder="Search..." type="text"/>
</div>
</div>
{/*  High-Density Utility List  */}
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
{/*  List Header  */}
<div className="hidden md:grid grid-cols-12 gap-2 px-md py-3 bg-surface-container border-b border-outline-variant text-outline font-label-medium text-[11px] uppercase tracking-wider">
<div className="col-span-5">Identity / Company</div>
<div className="col-span-2">Status</div>
<div className="col-span-3">Role</div>
<div className="col-span-1 text-center">ID</div>
<div className="col-span-1 text-right"></div>
</div>
{/*  List Items  */}
<div className="divide-y divide-outline-variant/30">
  {users.length === 0 ? (
    <div className="p-md text-center text-on-surface-variant">No users found</div>
  ) : (
    users.map((user: any) => (
      <div key={user.id} className="grid grid-cols-12 items-center gap-2 px-md py-2.5 hover:bg-surface-container-low transition-colors group">
        <div className="col-span-12 md:col-span-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant flex items-center justify-center bg-surface-container-highest">
            <img alt="" className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}&backgroundColor=000000`} />
          </div>
          <div className="flex flex-col">
            <span className="font-body-main text-[14px] font-semibold text-on-background">{user.fullName}</span>
            <span className="font-caption text-[11px] text-on-surface-variant">{user.email}</span>
          </div>
        </div>
        <div className="col-span-6 md:col-span-2 flex items-center gap-2 mt-1 md:mt-0">
          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-tertiary pulse-active' : 'bg-outline-variant'}`}></div>
          <span className={`font-caption text-[12px] ${user.isActive ? 'text-tertiary' : 'text-outline'}`}>{user.isActive ? 'Active' : 'Suspended'}</span>
        </div>
        <div className="col-span-6 md:col-span-3 mt-1 md:mt-0">
          <span className={`font-label-medium text-[11px] px-2 py-0.5 rounded border ${
            user.role === 'admin' ? 'border-primary/60 text-primary bg-primary/10' : 'border-secondary/30 text-secondary bg-secondary/5'
          }`}>{user.role}</span>
        </div>
        <div className="hidden md:block col-span-1 text-center font-caption text-[11px] text-outline">{user.id?.substring(0, 2).toUpperCase()}</div>
        <div className="col-span-12 md:col-span-1 text-right mt-2 md:mt-0">
          <button className="material-symbols-outlined text-outline hover:text-primary transition-colors text-[20px]">more_vert</button>
        </div>
      </div>
    ))
  )}
</div>
{/*  Footer pagination/summary  */}
<div className="px-md py-2 bg-surface-container-high/50 border-t border-outline-variant flex justify-between items-center text-[11px] text-outline">
<span>Showing {users.length} users</span>
<div className="flex gap-4">
<button className="hover:text-primary">Prev</button>
<button className="hover:text-primary font-bold text-primary">Next</button>
</div>
</div>
</div>
{/*  Utility Empty State (Subtle)  */}
<div className="mt-lg p-lg border border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center opacity-30">
<span className="material-symbols-outlined text-[32px] mb-sm">filter_list_off</span>
<p className="font-caption text-[12px] max-w-xs">End of filtered results</p>
</div>
</main>
</div>
{/*  Floating Action Button  */}
<button className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-12 h-12 bg-primary text-on-primary rounded-lg shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
<span className="material-symbols-outlined text-[24px]">person_add</span>
</button>
{/*  Bottom Navigation Bar (Mobile Only)  */}
<footer className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container border-t border-outline-variant shadow-lg z-50">
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-90">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-[10px]">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-90">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-[10px]">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-90">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-[10px]">Orders</span>
</div>
<div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-lg px-3 py-1 scale-90">
<span className="material-symbols-outlined" >group</span>
<span className="font-label-medium text-[10px]">Users</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 scale-90">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-[10px]">System</span>
</div>
</footer>


    </div>
  );
}
