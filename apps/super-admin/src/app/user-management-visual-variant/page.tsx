"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserManagementVisualVariantPage() {

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
<header className="fixed top-0 w-full z-50 bg-background dark:bg-background text-primary dark:text-primary border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-high rounded-full p-2 transition-colors">grid_view</span>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Admin</h1>
</div>
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3KeO5DFdwD-MULoh4EqoMoEe0LTxyH54tUVLfh397w40Jrnt19Kv2fWD60gS45RtVygEn87_4xxRa7Y-IfRd1t4JTO0crC5OHgUXp_22FIlexV09y5bPsEpyfWSOHlepCPgDPQYrWUqF1aCTpFqrgLugS00P_XFAI_g3z5fRbNB4HHIFdcuu7u-52I4eGlU3ZSZZS83wFGfB8KRbdN92WwprbbU-kH44JQbVeLT2VhbxdSlwTEy4gSIHy2yUbczWOcm2AXYTyoJ7d"/>
</div>
</div>
</header>
<div className="flex pt-16 min-h-screen">
{/*  Navigation Drawer (Desktop)  */}
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
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#"><span className="material-symbols-outlined">terminal</span><span className="font-body-main">Command Center</span></a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-200" href="#"><span className="material-symbols-outlined">sync_alt</span><span className="font-body-main">ERP Integration</span></a>
<a className="flex items-center gap-3 px-md py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg" href="#"><span className="material-symbols-outlined" >group</span><span className="font-body-main">User Management</span></a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg" href="#"><span className="material-symbols-outlined">campaign</span><span className="font-body-main">Broadcasts</span></a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg" href="#"><span className="material-symbols-outlined">terminal</span><span className="font-body-main">System Logs</span></a>
<a className="flex items-center gap-3 px-md py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg" href="#"><span className="material-symbols-outlined">help_outline</span><span className="font-body-main">Support</span></a>
</nav>
</aside>
{/*  Main Content Canvas  */}
<main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop pb-32">
<div className="mb-lg">
<h2 className="font-screen-title text-screen-title mb-1 text-on-background">User Management</h2>
<p className="font-body-compact text-body-compact text-on-surface-variant">Oversee system roles, permissions, and vendor-staff identities.</p>
</div>
{/*  Controls  */}
<div className="flex flex-col lg:flex-row gap-md mb-xl items-start lg:items-center justify-between">
<div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant w-full lg:w-auto">
<button className="px-lg py-2 rounded-xl font-label-medium text-label-medium text-on-primary-fixed bg-primary-container">All</button>
<button className="px-lg py-2 rounded-xl font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface">Vendor Staff</button>
<button className="px-lg py-2 rounded-xl font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface">Admins</button>
<button className="px-lg py-2 rounded-xl font-label-medium text-label-medium text-on-surface-variant hover:text-on-surface">Active</button>
</div>
<div className="relative w-full lg:w-96">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full bg-surface-container-high border border-outline-variant rounded-2xl py-3 pl-12 pr-4 text-body-main font-body-main focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all placeholder:text-outline" placeholder="Search by name, role, or vendor..." type="text"/>
</div>
</div>
{/*  User Cards Grid: Visual Explorer Variant  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-lg">
{/*  User Card 1  */}
<div className="bg-surface-container-low border border-outline-variant rounded-3xl p-lg user-card-glow transition-all duration-300 flex flex-col gap-lg group">
<div className="flex gap-lg items-start">
{/*  Enlarged Avatar with Overlay Status  */}
<div className="relative flex-shrink-0">
<div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary-container/30 ring-4 ring-surface-container-low">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5wQnElIE3rfVibN9AKn6ZnvRH_9EVmoeh7t_9uL-y3YWPBkQ17s6HEqtGQoFqckQ4VDLoRoCzIhAIZXwDlgrJFzrX5GlXdJjH_ZmhYLHGToab8R6NSnDG8m-M2nbS2p4K1IuMBhqzALGt9iY8aXmKDtcGf-hsmnONeSArkzntidh6SaHUGSH8WmFp5x7Peezwsfc6NPGnzhWajEOYr8pKGP37ROJwWsT2XAmLwhBDLXWqg9qX7RlE1D_P2KpdJespvPgWH67CqN5w"/>
</div>
<div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary px-2 py-0.5 rounded-lg font-caption text-[10px] uppercase font-bold border-2 border-surface-container-low shadow-lg">Active</div>
</div>
<div className="flex-1 min-w-0">
<div className="flex justify-between items-start">
<div>
<h3 className="font-screen-title text-xl text-on-background truncate">Marcus Chen</h3>
<p className="font-body-compact text-on-surface-variant">Logistics Lead • Global Express</p>
</div>
<button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">more_vert</button>
</div>
{/*  Metadata Horizontal Scroll  */}
<div className="mt-md flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth no-scrollbar">
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-secondary flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">verified_user</span> Vendor Staff
                </span>
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">history</span> ID: 88291
                </span>
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">location_on</span> NYC Hub
                </span>
</div>
</div>
</div>
{/*  Quick Action Tray  */}
<div className="flex items-center justify-between bg-surface-container-high/50 p-2 rounded-2xl border border-outline-variant/30">
<div className="flex gap-1">
<button className="w-10 h-10 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center text-on-surface-variant" title="Message">
<span className="material-symbols-outlined text-[20px]">chat_bubble</span>
</button>
<button className="w-10 h-10 rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center justify-center text-on-surface-variant" title="Edit Profile">
<span className="material-symbols-outlined text-[20px]">edit</span>
</button>
<button className="w-10 h-10 rounded-xl hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center text-on-surface-variant" title="Force Logout">
<span className="material-symbols-outlined text-[20px]">logout</span>
</button>
</div>
<button className="px-4 py-2 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container rounded-xl font-label-medium transition-all">View Details</button>
</div>
</div>
{/*  User Card 2  */}
<div className="bg-surface-container-low border border-outline-variant rounded-3xl p-lg user-card-glow transition-all duration-300 flex flex-col gap-lg group">
<div className="flex gap-lg items-start">
<div className="relative flex-shrink-0">
<div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-secondary/30 ring-4 ring-surface-container-low">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLsTAC8xhYRWVszLPCTu2Mq1vv1Pr_HrtmomY5TNN1ZqM-73yI8_2d2TkHRhE3R0DP5rJNKQJZjgbEmHvhE0JefdiO2h8vPqxDzaZQuGyYk_q8-HLzrQ-axRUwmYYhqqOknO-_CY3oSRvR-y3Jk2kYRWaz6iXZEQF5_f1yIPhUshoTBpm9u5GR2lb3UQTQkUa-DjrD4xqjTYtdeIm6w6TuWSaMLwM16cuko5t5PupK3UsHWDYsZzvBsWisl_3JZ1DYOnmRNEknj6MJ"/>
</div>
<div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary px-2 py-0.5 rounded-lg font-caption text-[10px] uppercase font-bold border-2 border-surface-container-low shadow-lg">Active</div>
</div>
<div className="flex-1 min-w-0">
<div className="flex justify-between items-start">
<div>
<h3 className="font-screen-title text-xl text-on-background truncate">Elena Rodriguez</h3>
<p className="font-body-compact text-on-surface-variant">System Admin • Doorli HQ</p>
</div>
<button className="material-symbols-outlined text-on-surface-variant">more_vert</button>
</div>
<div className="mt-md flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-secondary flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">key</span> Super Admin
                </span>
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">security</span> Root Access
                </span>
</div>
</div>
</div>
<div className="flex items-center justify-between bg-surface-container-high/50 p-2 rounded-2xl border border-outline-variant/30">
<div className="flex gap-1">
<button className="w-10 h-10 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">chat_bubble</span></button>
<button className="w-10 h-10 rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">edit</span></button>
<button className="w-10 h-10 rounded-xl hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">logout</span></button>
</div>
<button className="px-4 py-2 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container rounded-xl font-label-medium transition-all">Console</button>
</div>
</div>
{/*  User Card 3  */}
<div className="bg-surface-container-low border border-outline-variant rounded-3xl p-lg user-card-glow transition-all duration-300 flex flex-col gap-lg group">
<div className="flex gap-lg items-start">
<div className="relative flex-shrink-0">
<div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-outline-variant ring-4 ring-surface-container-low grayscale opacity-70">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr-XI25aPQ_YTmncLeBsK7i2d6SINWrUwWvAlnaQiDVJ7HNhBJZSR9cJ5kAw8lRwDLWPQcQa_wXe_Drd3wsAWyBljaUwUnULFISmaVHEXBJANqVAt_OJSvyiyfezD7X3bS-d2X-6afioTr6SUnFG7iyMxBzIwbne0RIi94PgtHGtBHyEt9hpzzJplLxVOoYWvhO1mO-nRJm6dTZJSb_5GOMYxWU3kM7p5Qd24aQTluElEji-iM1milOD1n_XthTh-woH0UcVLDOiKM"/>
</div>
<div className="absolute -bottom-1 -right-1 bg-surface-container-highest text-outline px-2 py-0.5 rounded-lg font-caption text-[10px] uppercase font-bold border-2 border-surface-container-low shadow-lg">Suspended</div>
</div>
<div className="flex-1 min-w-0">
<div className="flex justify-between items-start">
<div>
<h3 className="font-screen-title text-xl text-on-background truncate">Jared Smith</h3>
<p className="font-body-compact text-on-surface-variant">Support L2 • SwiftDelivery</p>
</div>
<button className="material-symbols-outlined text-on-surface-variant">more_vert</button>
</div>
<div className="mt-md flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-secondary flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">verified_user</span> Vendor Staff
                </span>
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">report</span> Violation
                </span>
</div>
</div>
</div>
<div className="flex items-center justify-between bg-surface-container-high/50 p-2 rounded-2xl border border-outline-variant/30">
<div className="flex gap-1">
<button className="w-10 h-10 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">chat_bubble</span></button>
<button className="w-10 h-10 rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">edit</span></button>
<button className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center" title="Restore"><span className="material-symbols-outlined text-[20px]">settings_backup_restore</span></button>
</div>
<button className="px-4 py-2 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container rounded-xl font-label-medium transition-all">Incident Log</button>
</div>
</div>
{/*  User Card 4  */}
<div className="bg-surface-container-low border border-outline-variant rounded-3xl p-lg user-card-glow transition-all duration-300 flex flex-col gap-lg group">
<div className="flex gap-lg items-start">
<div className="relative flex-shrink-0">
<div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary-container/30 ring-4 ring-surface-container-low">
<img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1VfptXYGm4JfgSphPUTUZlrFdmJOawc9txVltHObiISoyoakpcHYJ7HEJYmanJH297In_GTYFUzHwhlejcrmRv5GXNo6MakuPXgZ0twsm7Bq-NivwCwDBKRhvIuTqLM08H5dXAdNXum0CXKA55bKgKGXx_a4BXACfPPGfyIrbxf3TS96oZaA5bLLopnctNQ38isCdjkd6Mcpb70UKAaB-I3gL8CJtYtAeutvNEU0X8G_2FWZ8T19rXr5oOqyh3qNiTj9jSboAlkFc"/>
</div>
<div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary px-2 py-0.5 rounded-lg font-caption text-[10px] uppercase font-bold border-2 border-surface-container-low shadow-lg">Active</div>
</div>
<div className="flex-1 min-w-0">
<div className="flex justify-between items-start">
<div>
<h3 className="font-screen-title text-xl text-on-background truncate">Sarah Jenkins</h3>
<p className="font-body-compact text-on-surface-variant">Operations Analyst • Doorli HQ</p>
</div>
<button className="material-symbols-outlined text-on-surface-variant">more_vert</button>
</div>
<div className="mt-md flex gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-secondary flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Admin
                </span>
<span className="flex-shrink-0 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant font-label-medium text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">monitoring</span> Analytics
                </span>
</div>
</div>
</div>
<div className="flex items-center justify-between bg-surface-container-high/50 p-2 rounded-2xl border border-outline-variant/30">
<div className="flex gap-1">
<button className="w-10 h-10 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">chat_bubble</span></button>
<button className="w-10 h-10 rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">edit</span></button>
<button className="w-10 h-10 rounded-xl hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">logout</span></button>
</div>
<button className="px-4 py-2 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container rounded-xl font-label-medium transition-all">Reports</button>
</div>
</div>
</div>
{/*  Empty State  */}
<div className="mt-xl p-xl border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
<span className="material-symbols-outlined text-[48px] mb-md">person_add_disabled</span>
<p className="font-body-main max-w-sm">No more users found matching current filters. Try adjusting your search or segment selection.</p>
</div>
</main>
</div>
{/*  Floating Action Button  */}
<button className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-16 h-16 bg-primary text-on-primary rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
<span className="material-symbols-outlined text-[32px]">person_add</span>
<span className="absolute right-full mr-4 bg-surface-container-high px-4 py-2 rounded-xl text-body-compact whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl border border-outline-variant">Create New User</span>
</button>
{/*  Bottom Navigation (Mobile)  */}
<footer className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-3 bg-surface-container border-t border-outline-variant shadow-lg z-50">
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary scale-95 transition-transform active:scale-90">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-xs">Command</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary scale-95 transition-transform active:scale-90">
<span className="material-symbols-outlined">storefront</span>
<span className="font-label-medium text-xs">Vendors</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary scale-95 transition-transform active:scale-90">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-label-medium text-xs">Orders</span>
</div>
<div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-fixed rounded-xl px-4 py-1.5 transition-transform scale-95 active:scale-90 shadow-md">
<span className="material-symbols-outlined" >group</span>
<span className="font-label-medium text-xs">Users</span>
</div>
<div className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary scale-95 transition-transform active:scale-90">
<span className="material-symbols-outlined">settings</span>
<span className="font-label-medium text-xs">System</span>
</div>
</footer>


    </div>
  );
}
