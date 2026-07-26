"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserDetailEditorialVariantPage() {

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      superAdminFetch('/admin/users').then(res => {
        if (res.success && res.data.length > 0) setUser(res.data[0]);
        setLoading(false);
      });
    }, []);
  
    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
<header className="w-full top-0 sticky bg-background border-b border-surface-variant z-50 flex justify-between items-center px-margin-mobile h-16">
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-primary p-2 rounded-full" data-icon="menu">menu</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli</h1>
</div>
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-on-surface-variant" data-icon="search">search</button>
<div className="w-8 h-8 rounded-full border border-outline overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Admin profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyockni94KebI6Ik6qLSscdsN6QQSWphHk1ZXtRgZpC605157X6-Uqvrie7SjpUENYu_Z6xkTcBAfw__W4eAOXrgDwbTTb3zK7a6Nw1IkcslIh8KGP9D5vbVAb8Qk62NtZIeG6vZHv5E6VdguNCMaLWErw83hHyaK6M-sbv3L1AgN4uBiFa7w1tNAtDAKGJCUNBiSEhPm46KAgh4Q0PAtPW8Zq4KcQpFe9RELZ83NEAXwhdiZlxo-Fd-0se2VIMpPe4gZyHE7zOU6G"/>
</div>
</div>
</header>
<main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop pt-xl pb-32">
{/*  Breadcrumb  */}
<div className="mb-xl">
<button className="flex items-center text-on-surface-variant font-label-medium hover:text-primary transition-colors group">
<span className="material-symbols-outlined mr-xs text-[18px] group-hover:-translate-x-1 transition-transform" data-icon="arrow_back">arrow_back</span> Users
        </button>
</div>
{/*  Editorial Header Section  */}
<section className="bg-surface-bright rounded-2xl p-lg md:p-xl border border-outline-variant/30 mb-xl">
<div className="flex flex-col md:flex-row gap-xl items-start md:items-center">
<div className="relative">
<div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary overflow-hidden shadow-2xl">
<img className="w-full h-full object-cover" data-alt="Marcus Thorne" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_36b7CKp6XA_sAhSsGAkH8L6Ujk640cTEi6qGWd57NhM0OvoN1EndfuWaDW3UgEQG23FQc1hOGmxDXm0p79kFFVtmEl0SE3gf6LzBayKHpj_AEsdPKFP0kkbWyWx5oNQ0b7XKUZKwC2d_nbofh1VGi60Dk4zaWro_Djg2dQEV7EFNcvfCmynmpfkA0qjCzMqd9N2UkyUBtzChEr41xczrr8Ji5WnVQ2nN8FD_NY-yOn_6QTHp5RckeGQXgUszU-aNaRNEkAgnvSsc"/>
</div>
<button className="absolute bottom-1 right-1 bg-primary text-on-primary p-1.5 rounded-full shadow-lg">
<span className="material-symbols-outlined text-[16px]" data-icon="edit">edit</span>
</button>
</div>
<div className="flex-1">
<div className="flex flex-wrap items-center gap-sm mb-xs">
<h2 className="text-[32px] md:text-[40px] font-bold tracking-tight text-on-surface">Marcus Thorne</h2>
<span className="px-3 py-0.5 bg-primary/10 text-primary font-caption text-[11px] uppercase tracking-widest border border-primary/20 rounded-full">Super Admin</span>
</div>
<p className="text-xl text-on-surface-variant font-light mb-md">m.thorne@doorli-corp.com</p>
<div className="flex gap-lg border-t border-outline-variant/20 pt-md">
<div>
<p className="text-on-surface-variant font-caption uppercase tracking-wider text-[10px] mb-0.5">Joined</p>
<p className="font-medium text-on-surface">October 2021</p>
</div>
<div>
<p className="text-on-surface-variant font-caption uppercase tracking-wider text-[10px] mb-0.5">Active</p>
<p className="font-medium text-on-surface">2 hours ago</p>
</div>
<div className="ml-auto flex items-center gap-md">
<button className="bg-on-surface text-surface px-lg py-2.5 rounded-full font-label-medium text-label-medium hover:bg-primary transition-colors" id="openActions">Admin Actions</button>
</div>
</div>
</div>
</div>
</section>
{/*  Typography-first Form Section  */}
<section className="mb-xl px-2">
<div className="flex items-center justify-between mb-lg border-b border-outline-variant/10 pb-sm">
<h3 className="text-2xl font-bold text-on-surface">Profile Details</h3>
<button className="text-secondary font-label-medium hover:underline">Edit Fields</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-xl gap-y-lg">
<div className="border-l-2 border-outline-variant/20 pl-md py-1">
<p className="text-on-surface-variant font-caption uppercase text-[10px] mb-1">Full Name</p>
<p className="text-lg text-on-surface">Marcus Thorne</p>
</div>
<div className="border-l-2 border-outline-variant/20 pl-md py-1">
<p className="text-on-surface-variant font-caption uppercase text-[10px] mb-1">Email</p>
<p className="text-lg text-on-surface">m.thorne@doorli-corp.com</p>
</div>
<div className="border-l-2 border-outline-variant/20 pl-md py-1">
<p className="text-on-surface-variant font-caption uppercase text-[10px] mb-1">Role Management</p>
<p className="text-lg text-on-surface">Super Admin</p>
</div>
<div className="border-l-2 border-outline-variant/20 pl-md py-1">
<p className="text-on-surface-variant font-caption uppercase text-[10px] mb-1">Assigned Vendor</p>
<p className="text-lg text-on-surface">Global Operations Hub</p>
</div>
</div>
</section>
{/*  Central Feature: Activity Log  */}
<section className="px-2">
<div className="flex items-center justify-between mb-lg border-b border-outline-variant/10 pb-sm">
<h3 className="text-2xl font-bold text-on-surface">Activity History</h3>
<div className="flex gap-2">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="filter_list">filter_list</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="refresh">refresh</button>
</div>
</div>
<div className="space-y-6">
{/*  Log Item 1  */}
<div className="flex gap-lg group">
<div className="flex flex-col items-center">
<div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0">
<img alt="User avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_36b7CKp6XA_sAhSsGAkH8L6Ujk640cTEi6qGWd57NhM0OvoN1EndfuWaDW3UgEQG23FQc1hOGmxDXm0p79kFFVtmEl0SE3gf6LzBayKHpj_AEsdPKFP0kkbWyWx5oNQ0b7XKUZKwC2d_nbofh1VGi60Dk4zaWro_Djg2dQEV7EFNcvfCmynmpfkA0qjCzMqd9N2UkyUBtzChEr41xczrr8Ji5WnVQ2nN8FD_NY-yOn_6QTHp5RckeGQXgUszU-aNaRNEkAgnvSsc"/>
</div>
<div className="w-0.5 h-full bg-outline-variant/10 my-2 group-last:hidden"></div>
</div>
<div className="flex-1 pb-6">
<div className="flex justify-between items-start mb-1">
<span className="text-on-surface font-semibold">Permission Escalation</span>
<span className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tighter">14 min ago</span>
</div>
<p className="text-on-surface-variant mb-2">Updated access level for user <span className="text-secondary">@j.smith</span> from 'Support' to 'Manager'</p>
<a className="text-primary font-label-medium text-[13px] flex items-center gap-1 hover:underline" href="#">
                        View Change <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
</a>
</div>
</div>
{/*  Log Item 2  */}
<div className="flex gap-lg group">
<div className="flex flex-col items-center">
<div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0">
<img alt="User avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_36b7CKp6XA_sAhSsGAkH8L6Ujk640cTEi6qGWd57NhM0OvoN1EndfuWaDW3UgEQG23FQc1hOGmxDXm0p79kFFVtmEl0SE3gf6LzBayKHpj_AEsdPKFP0kkbWyWx5oNQ0b7XKUZKwC2d_nbofh1VGi60Dk4zaWro_Djg2dQEV7EFNcvfCmynmpfkA0qjCzMqd9N2UkyUBtzChEr41xczrr8Ji5WnVQ2nN8FD_NY-yOn_6QTHp5RckeGQXgUszU-aNaRNEkAgnvSsc"/>
</div>
<div className="w-0.5 h-full bg-outline-variant/10 my-2 group-last:hidden"></div>
</div>
<div className="flex-1 pb-6">
<div className="flex justify-between items-start mb-1">
<span className="text-on-surface font-semibold">Vendor Reassignment</span>
<span className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tighter">2 hours ago</span>
</div>
<p className="text-on-surface-variant mb-2">Transferred <span className="text-secondary">Urban Eats Co.</span> to EU Logistics cluster for optimization.</p>
<a className="text-primary font-label-medium text-[13px] flex items-center gap-1 hover:underline" href="#">
                        View Change <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
</a>
</div>
</div>
{/*  Log Item 3  */}
<div className="flex gap-lg group">
<div className="flex flex-col items-center">
<div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0">
<img alt="User avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_36b7CKp6XA_sAhSsGAkH8L6Ujk640cTEi6qGWd57NhM0OvoN1EndfuWaDW3UgEQG23FQc1hOGmxDXm0p79kFFVtmEl0SE3gf6LzBayKHpj_AEsdPKFP0kkbWyWx5oNQ0b7XKUZKwC2d_nbofh1VGi60Dk4zaWro_Djg2dQEV7EFNcvfCmynmpfkA0qjCzMqd9N2UkyUBtzChEr41xczrr8Ji5WnVQ2nN8FD_NY-yOn_6QTHp5RckeGQXgUszU-aNaRNEkAgnvSsc"/>
</div>
<div className="w-0.5 h-full bg-outline-variant/10 my-2 group-last:hidden"></div>
</div>
<div className="flex-1 pb-6">
<div className="flex justify-between items-start mb-1">
<span className="text-on-surface font-semibold">Audit Export</span>
<span className="text-on-surface-variant text-[11px] font-medium uppercase tracking-tighter">Yesterday</span>
</div>
<p className="text-on-surface-variant mb-2">Generated full Q3 infrastructure compliance report for stakeholder review.</p>
<a className="text-primary font-label-medium text-[13px] flex items-center gap-1 hover:underline" href="#">
                        View Change <span className="material-symbols-outlined text-[16px]" data-icon="open_in_new">open_in_new</span>
</a>
</div>
</div>
<button className="w-full py-3 border border-outline-variant/20 rounded-xl text-on-surface-variant font-label-medium hover:bg-surface-container transition-colors">
                Load more history
            </button>
</div>
</section>
</main>
{/*  Bottom Navigation (Mobile)  */}
<nav className="fixed bottom-0 w-full z-40 bg-surface-container border-t border-surface-variant flex justify-around items-center h-16 md:hidden px-2 pb-safe">
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#"><span className="material-symbols-outlined" data-icon="dashboard">dashboard</span><span className="text-[10px]">Home</span></a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#"><span className="material-symbols-outlined" data-icon="store">store</span><span className="text-[10px]">Vendors</span></a>
<a className="flex flex-col items-center justify-center text-primary px-3 py-1 font-bold" href="#"><span className="material-symbols-outlined" data-icon="group">group</span><span className="text-[10px]">Users</span></a>
<a className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" href="#"><span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span><span className="text-[10px]">Orders</span></a>
<button className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1" id="mobileActions"><span className="material-symbols-outlined" data-icon="settings_suggest">settings_suggest</span><span className="text-[10px]">Admin</span></button>
</nav>
{/*  Admin Actions Bottom Sheet  */}
<div className="fixed inset-0 bg-black/60 z-[60] hidden backdrop-blur-sm" id="backdrop"></div>
<div className="fixed bottom-0 left-0 right-0 z-[70] bg-surface-container border-t border-outline-variant rounded-t-3xl p-lg bottom-sheet md:max-w-md md:mx-auto md:rounded-3xl md:mb-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:transform-none" id="bottomSheet">
<div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-lg md:hidden"></div>
<div className="flex items-center justify-between mb-xl">
<h3 className="text-xl font-bold text-on-surface">Admin Controls</h3>
<button className="material-symbols-outlined text-on-surface-variant" data-icon="close" id="closeActions">close</button>
</div>
<div className="space-y-md">
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-2xl border border-outline-variant/30 transition-all group">
<div className="flex items-center gap-md">
<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" data-icon="logout">logout</span>
</div>
<span className="font-label-medium">Force Session Logout</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant" data-icon="chevron_right">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-2xl border border-outline-variant/30 transition-all group">
<div className="flex items-center gap-md">
<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" data-icon="vibration">vibration</span>
</div>
<span className="font-label-medium">Reset MFA Keys</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant" data-icon="chevron_right">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-md bg-error-container/10 hover:bg-error-container/20 rounded-2xl border border-error/20 transition-all group">
<div className="flex items-center gap-md">
<div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
<span className="material-symbols-outlined" data-icon="person_off">person_off</span>
</div>
<span className="font-label-medium text-error">Deactivate User Account</span>
</div>
<span className="material-symbols-outlined text-error/40" data-icon="chevron_right">chevron_right</span>
</button>
</div>
<div className="mt-xl">
<p className="text-on-surface-variant text-[11px] text-center uppercase tracking-widest px-xl">Security changes are logged and broadcast to regional safety officers.</p>
</div>
</div>


    </div>
  );
}
