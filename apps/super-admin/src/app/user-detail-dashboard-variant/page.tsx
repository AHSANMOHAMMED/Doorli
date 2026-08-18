"use client";

import React, { useState, useEffect } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function UserDetailDashboardVariantPage() {

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
      
<header className="w-full top-0 sticky bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant z-50 flex justify-between items-center px-margin-mobile h-16 w-full">
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-primary dark:text-primary transition-colors duration-200 hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full" data-icon="menu">menu</button>
<h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Doorli Super Admin</h1>
</div>
<div className="flex items-center gap-2">
<button className="material-symbols-outlined text-on-surface-variant dark:text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high dark:hover:bg-surface-container-high p-2 rounded-full" data-icon="notifications">notifications</button>
<div className="w-8 h-8 rounded-full border border-outline overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a female technology executive with short dark hair, wearing a sleek black blazer. She is set against a dark, moody studio background with subtle red rim lighting that matches the Doorli corporate palette. High contrast, sharp focus, technical professional aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyockni94KebI6Ik6qLSscdsN6QQSWphHk1ZXtRgZpC605157X6-Uqvrie7SjpUENYu_Z6xkTcBAfw__W4eAOXrgDwbTTb3zK7a6Nw1IkcslIh8KGP9D5vbVAb8Qk62NtZIeG6vZHv5E6VdguNCMaLWErw83hHyaK6M-sbv3L1AgN4uBiFa7w1tNAtDAKGJCUNBiSEhPm46KAgh4Q0PAtPW8Zq4KcQpFe9RELZ83NEAXwhdiZlxo-Fd-0se2VIMpPe4gZyHE7zOU6G"/>
</div>
</div>
</header>
<main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-32">
<div className="flex items-center gap-md mb-lg">
<button className="flex items-center text-secondary font-label-medium text-label-medium hover:underline transition-all">
<span className="material-symbols-outlined mr-xs" data-icon="arrow_back">arrow_back</span> Back to User List
            </button>
</div>
{/*  Activity Timeline - Re-visualized as condensed horizontal top section  */}
<section className="mb-lg bg-surface-container border border-outline-variant rounded-xl p-md overflow-hidden">
<div className="flex items-center justify-between mb-sm">
<h3 className="font-label-medium text-label-medium text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="history">history</span> Recent Activity
                </h3>
<button className="text-secondary font-caption text-caption hover:underline">View All</button>
</div>
<div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
<div className="flex-shrink-0 flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30 max-w-[200px]">
<span className="material-symbols-outlined text-primary text-sm" data-icon="security_update_good">security_update_good</span>
<div className="truncate">
<p className="font-label-medium text-label-medium text-on-surface truncate">Permissions Modified</p>
<p className="font-caption text-caption text-on-surface-variant truncate">14 mins ago</p>
</div>
</div>
<div className="flex-shrink-0 flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30 max-w-[200px]">
<span className="material-symbols-outlined text-secondary text-sm" data-icon="store">store</span>
<div className="truncate">
<p className="font-label-medium text-label-medium text-on-surface truncate">Vendor Change</p>
<p className="font-caption text-caption text-on-surface-variant truncate">2 hours ago</p>
</div>
</div>
<div className="flex-shrink-0 flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30 max-w-[200px]">
<span className="material-symbols-outlined text-tertiary text-sm" data-icon="policy">policy</span>
<div className="truncate">
<p className="font-label-medium text-label-medium text-on-surface truncate">Audit Downloaded</p>
<p className="font-caption text-caption text-on-surface-variant truncate">Yesterday</p>
</div>
</div>
<div className="flex-shrink-0 flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30 max-w-[200px]">
<span className="material-symbols-outlined text-error text-sm" data-icon="warning">warning</span>
<div className="truncate">
<p className="font-label-medium text-label-medium text-on-surface truncate">Forced Suspension</p>
<p className="font-caption text-caption text-on-surface-variant truncate">Oct 24</p>
</div>
</div>
</div>
</section>
<div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
{/*  Left Column: Hero & Profile Bento  */}
<div className="md:col-span-8 flex flex-col gap-lg">
{/*  Hero Section  */}
<section className="bg-surface-container-high border border-outline-variant rounded-xl p-xl flex flex-col items-center text-center relative overflow-hidden">
<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
<div className="relative mb-lg">
<div className="relative w-40 h-40 rounded-full live-status-ring">
<div className="w-full h-full rounded-full border-4 border-surface-container overflow-hidden shadow-2xl relative z-10">
<img className="w-full h-full object-cover" data-alt="Marcus Thorne profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_36b7CKp6XA_sAhSsGAkH8L6Ujk640cTEi6qGWd57NhM0OvoN1EndfuWaDW3UgEQG23FQc1hOGmxDXm0p79kFFVtmEl0SE3gf6LzBayKHpj_AEsdPKFP0kkbWyWx5oNQ0b7XKUZKwC2d_nbofh1VGi60Dk4zaWro_Djg2dQEV7EFNcvfCmynmpfkA0qjCzMqd9N2UkyUBtzChEr41xczrr8Ji5WnVQ2nN8FD_NY-yOn_6QTHp5RckeGQXgUszU-aNaRNEkAgnvSsc"/>
</div>
<div className="absolute bottom-1 right-1 w-8 h-8 bg-tertiary rounded-full border-4 border-surface-container-high z-20 flex items-center justify-center">
<span className="w-2.5 h-2.5 bg-on-tertiary rounded-full"></span>
</div>
</div>
</div>
<h2 className="font-screen-title text-screen-title text-on-surface mb-xs">Marcus Thorne</h2>
<div className="flex items-center gap-2 mb-md">
<span className="px-3 py-0.5 bg-tertiary-container/20 text-tertiary font-caption text-caption rounded-full border border-tertiary/30 uppercase tracking-widest">Super Admin</span>
<span className="text-on-surface-variant font-body-compact text-body-compact">•</span>
<span className="text-on-surface-variant font-body-compact text-body-compact">m.thorne@doorli-corp.com</span>
</div>
</section>
{/*  Profile Bento Grid  */}
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
{/*  Name Card  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-secondary transition-colors cursor-pointer">
<span className="material-symbols-outlined text-secondary text-xl mb-md" data-icon="badge">badge</span>
<div>
<p className="text-on-surface-variant font-caption text-caption uppercase mb-1">Full Name</p>
<p className="font-label-medium text-label-medium text-on-surface">Marcus Thorne</p>
</div>
</div>
{/*  Email Card  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-secondary transition-colors cursor-pointer">
<span className="material-symbols-outlined text-secondary text-xl mb-md" data-icon="mail">mail</span>
<div>
<p className="text-on-surface-variant font-caption text-caption uppercase mb-1">Email Address</p>
<p className="font-label-medium text-label-medium text-on-surface truncate">m.thorne@doorli-corp.com</p>
</div>
</div>
{/*  Vendor Card  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-secondary transition-colors cursor-pointer">
<span className="material-symbols-outlined text-secondary text-xl mb-md" data-icon="corporate_fare">corporate_fare</span>
<div>
<p className="text-on-surface-variant font-caption text-caption uppercase mb-1">Assigned Vendor</p>
<p className="font-label-medium text-label-medium text-on-surface">Global Operations</p>
</div>
</div>
{/*  Joined Card  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between">
<span className="material-symbols-outlined text-on-surface-variant text-xl mb-md" data-icon="calendar_today">calendar_today</span>
<div>
<p className="text-on-surface-variant font-caption text-caption uppercase mb-1">Member Since</p>
<p className="font-label-medium text-label-medium text-on-surface">Oct 2021</p>
</div>
</div>
{/*  Last Seen Card  */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between">
<span className="material-symbols-outlined text-on-surface-variant text-xl mb-md" data-icon="visibility">visibility</span>
<div>
<p className="text-on-surface-variant font-caption text-caption uppercase mb-1">Last Active</p>
<p className="font-label-medium text-label-medium text-on-surface">2 hours ago</p>
</div>
</div>
{/*  Edit Action Card  */}
<button className="bg-primary text-on-primary rounded-xl p-md flex flex-col items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10">
<span className="material-symbols-outlined text-2xl" data-icon="edit_note">edit_note</span>
<span className="font-label-medium text-label-medium">Update Profile</span>
</button>
</section>
</div>
{/*  Right Column: Security Panel  */}
<aside className="md:col-span-4 flex flex-col gap-lg">
<section className="bg-surface-container-highest border border-outline-variant rounded-xl p-md shadow-2xl">
<h3 className="font-section-header text-section-header text-on-surface mb-md flex items-center gap-2">
<span className="material-symbols-outlined text-error" data-icon="security">security</span> Security Controls
                    </h3>
<p className="text-on-surface-variant font-caption text-caption mb-lg">Manage account access, 2FA settings, and status.</p>
<div className="flex flex-col gap-sm">
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-lg border border-outline-variant/50 transition-all group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary" data-icon="logout">logout</span>
<span className="font-label-medium text-label-medium">Force Logout</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-lg border border-outline-variant/50 transition-all group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary" data-icon="lock_reset">lock_reset</span>
<span className="font-label-medium text-label-medium">Reset 2FA Token</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-lg border border-outline-variant/50 transition-all group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary" data-icon="password">password</span>
<span className="font-label-medium text-label-medium">Temp Password</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
<div className="my-md border-t border-outline-variant/30"></div>
<button className="w-full flex items-center justify-between p-md bg-error-container/10 hover:bg-error-container/20 rounded-lg border border-error/50 transition-all group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-error" data-icon="person_off">person_off</span>
<div className="text-left">
<span className="block font-label-medium text-label-medium text-error">Deactivate Account</span>
<span className="block font-caption text-caption text-error/70">Immediate access removal</span>
</div>
</div>
<span className="material-symbols-outlined text-error/60 group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</section>
<div className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h4 className="font-label-medium text-label-medium text-on-surface mb-sm">System Compliance</h4>
<div className="flex items-center gap-2 mb-md">
<div className="h-2 flex-1 bg-surface-container-low rounded-full overflow-hidden">
<div className="h-full bg-tertiary w-[85%]"></div>
</div>
<span className="text-tertiary font-caption text-caption">85%</span>
</div>
<p className="text-on-surface-variant font-caption text-caption">Account meets mandatory security protocols for Super Admin status.</p>
</div>
</aside>
</div>
</main>
<nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 w-full px-2 pb-safe md:hidden">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/dashboard">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/vendors-management">
<span className="material-symbols-outlined" data-icon="store">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="/user-management">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/global-orders-finalized">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 hover:bg-surface-variant dark:hover:bg-surface-variant active:scale-95 transition-transform duration-150" href="/system-settings-profile">
<span className="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>
<div className="hidden md:flex fixed left-0 top-16 bottom-0 w-[240px] bg-surface-container border-r border-outline-variant p-md flex-col gap-sm">
<a className="flex items-center gap-md p-md rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors" href="/user-management">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex items-center gap-md p-md rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors" href="/vendors-management">
<span className="material-symbols-outlined" data-icon="store">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex items-center gap-md p-md rounded-xl bg-primary-container text-on-primary-container" href="/user-detail">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex items-center gap-md p-md rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors" href="/global-orders-finalized">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<div className="mt-auto pt-md border-t border-outline-variant">
<a className="flex items-center gap-md p-md rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors" href="/system-settings-profile">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span className="font-label-medium text-label-medium">System Settings</span>
</a>
<a className="flex items-center gap-md p-md rounded-xl text-error/80 hover:bg-error-container/10 transition-colors" href="/user-management">
<span className="material-symbols-outlined" data-icon="logout">logout</span>
<span className="font-label-medium text-label-medium">Sign Out</span>
</a>
</div>
</div>

    </div>
  );
}
