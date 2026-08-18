"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    superAdminFetch('/admin/users').then((res) => {
      if (res.success) setUsers(res.data);
    }).catch(console.error);
  }, []);

  async function toggleActive(user: any) {
    setUpdating(user.id);
    try {
      const res = await superAdminFetch(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.success) {
        setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isActive: !user.isActive } : item));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Top App Bar (Shared Component)  */}
<header className="fixed top-0 w-full z-50 bg-background dark:bg-background text-primary dark:text-primary border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-colors">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a corporate super admin for a high-tech platform, featuring subtle red and blue lighting accents on a dark background. The subject is a confident individual with a clean-cut appearance. The image reflects a technical, precise, and authoritative aesthetic consistent with a technical command center environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3KeO5DFdwD-MULoh4EqoMoEe0LTxyH54tUVLfh397w40Jrnt19Kv2fWD60gS45RtVygEn87_4xxRa7Y-IfRd1t4JTO0crC5OHgUXp_22FIlexV09y5bPsEpyfWSOHlepCPgDPQYrWUqF1aCTpFqrgLugS00P_XFAI_g3z5fRbNB4HHIFdcuu7u-52I4eGlU3ZSZZS83wFGfB8KRbdN92WwprbbU-kH44JQbVeLT2VhbxdSlwTEy4gSIHy2yUbczWOcm2AXYTyoJ7d"/>
</div>
</div>
</header>
<div className="flex pt-16 min-h-screen">
{/*  Navigation Drawer (Desktop Only)  */}
<aside className="hidden md:flex h-full w-64 fixed left-0 bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant dark:border-outline-variant shadow-xl flex-col p-sm space-y-base overflow-y-auto custom-scrollbar z-40">
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
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/dashboard">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">Command Center</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/erp-synchronization-logs">
<span className="material-symbols-outlined">sync_alt</span>
<span className="font-body-main text-body-main">ERP Integration</span>
</a>
<a className="flex items-center gap-3 px-md py-3 bg-secondary-container dark:bg-secondary-container text-on-secondary-container dark:text-on-secondary-container font-bold rounded-lg transition-all duration-200" href="/user-management">
<span className="material-symbols-outlined" >group</span>
<span className="font-body-main text-body-main">User Management</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/system-broadcasts">
<span className="material-symbols-outlined">campaign</span>
<span className="font-body-main text-body-main">Broadcasts</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-lg transition-all duration-200" href="/erp-synchronization-logs">
<span className="material-symbols-outlined">terminal</span>
<span className="font-body-main text-body-main">System Logs</span>
</a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-lg transition-all duration-200" href="mailto:support@doorli.me">
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
<p className="font-body-compact text-body-compact text-on-surface-variant">Oversee system roles, permissions, and vendor-staff identities.</p>
</div>
{/*  Controls: Search & Segmented Filter  */}
<div className="flex flex-col lg:flex-row gap-md mb-xl items-start lg:items-center justify-between">
{/*  Segmented Control  */}
<div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant w-full lg:w-auto">
<button className="px-lg py-2 rounded-lg font-label-medium text-label-medium text-on-primary-fixed bg-primary-container segmented-control-active">All</button>
<button className="px-lg py-2 rounded-lg font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface transition-colors">Vendor Staff</button>
<button className="px-lg py-2 rounded-lg font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface transition-colors">Admins</button>
<button className="px-lg py-2 rounded-lg font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface transition-colors">Active</button>
</div>
{/*  Search Bar  */}
<div className="relative w-full lg:w-96">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-3 pl-12 pr-4 text-body-main font-body-main focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all placeholder:text-outline" placeholder="Search by name, role, or vendor..." type="text"/>
</div>
</div>
{/*  User Cards Grid (Bento Pattern)  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-md">
{users.map(user => (
<div key={user.id} className="bg-surface-container border border-outline-variant rounded-xl p-md hover:bg-surface-container-high transition-colors group">
<div className="flex justify-between items-start mb-md">
<div className={`w-12 h-12 rounded-full overflow-hidden border-2 ring-2 ring-background ${user.isActive ? 'border-primary' : 'border-outline-variant grayscale'}`}>
<img className="w-full h-full object-cover" data-alt="User Avatar" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}&backgroundColor=000000`} />
</div>
<span className={`${user.isActive ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-highest text-outline'} font-caption text-caption px-2 py-0.5 rounded-full`}>{user.isActive ? 'Active' : 'Suspended'}</span>
</div>
<h3 className="font-section-header text-section-header text-on-background mb-0.5">{user.fullName}</h3>
<p className="font-body-compact text-body-compact text-on-surface-variant mb-4">{user.email}</p>
<div className="border-t border-outline-variant pt-md flex justify-between items-center">
<div className="flex flex-col">
<span className="font-caption text-[10px] uppercase text-outline">Role</span>
<span className="font-label-medium text-label-medium text-secondary">{user.role}</span>
</div>
<div className="flex items-center gap-2">
 <button type="button" disabled={updating === user.id} onClick={() => void toggleActive(user)} className="rounded-lg border border-outline-variant px-2 py-1 text-xs text-on-surface-variant disabled:opacity-50">
  {updating === user.id ? 'Updating...' : user.isActive ? 'Deactivate' : 'Activate'}
 </button>
 <a href={`/user-detail?id=${user.id}`} className="material-symbols-outlined text-on-surface-variant">more_vert</a>
</div>
</div>
</div>
))}
</div>
{/*  Empty State Contextual Element (Subtle)  */}
<div className="mt-xl p-xl border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
<span className="material-symbols-outlined text-[48px] mb-md">person_add_disabled</span>
<p className="font-body-main text-body-main max-w-sm">No more users found matching current filters. Try adjusting your search or segment selection.</p>
</div>
</main>
</div>
{/*  Floating Action Button  */}
<button className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-14 h-14 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
<span className="material-symbols-outlined text-[28px]">person_add</span>
<span className="absolute right-full mr-4 bg-surface-container-high px-3 py-1 rounded text-body-compact whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-outline-variant">Create User</span>
</button>
{/*  Bottom Navigation Bar (Mobile Only)  */}
<footer className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-surface-container dark:bg-surface-container border-t border-outline-variant dark:border-outline-variant shadow-lg z-50">
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary transition-transform scale-95 active:scale-90">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary transition-transform scale-95 active:scale-90">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary transition-transform scale-95 active:scale-90">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-label-medium">Orders</span>
</div>
<div className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-fixed dark:text-on-primary-fixed rounded-xl px-3 py-1 transition-transform scale-95 active:scale-90">
<span className="material-symbols-outlined" >group</span>
<span className="font-label-medium text-label-medium">Users</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-3 py-1 hover:text-primary transition-transform scale-95 active:scale-90">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-label-medium">System</span>
</div>
</footer>


    </div>
  );
}
