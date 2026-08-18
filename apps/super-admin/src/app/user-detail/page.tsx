"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function UserDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      superAdminFetch(`/admin/users/${id}`).then((res) => {
        if (res.success) setUser(res.data);
      }).catch(console.error);
    }
  }, [id]);

  const toggleStatus = async () => {
    if (!user) return;
    const res = await superAdminFetch(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !user.isActive })
    });
    if (res.success) setUser(res.data);
  };

  const updateRole = async (role: string) => {
    if (!user) return;
    const res = await superAdminFetch(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    if (res.success) setUser(res.data);
  };

  if (!user) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><p className="text-white">Loading...</p></div>;

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
<div className="flex flex-col md:flex-row items-center gap-md mb-xl">
<button className="flex items-center text-secondary font-label-medium text-label-medium hover:underline transition-all">
<span className="material-symbols-outlined mr-xs" data-icon="arrow_back">arrow_back</span> Back to User List
            </button>
</div>
<div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
<section className="md:col-span-4 flex flex-col gap-lg">
<div className="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col items-center text-center">
<div className="relative group">
<div className="w-32 h-32 rounded-full border-4 border-primary-container overflow-hidden mb-md shadow-lg shadow-black/40">
<img className="w-full h-full object-cover" data-alt="User avatar" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}&backgroundColor=000000`}/>
</div>
<button className="absolute bottom-4 right-0 bg-primary text-on-primary p-2 rounded-full shadow-md hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
</button>
</div>
<h2 className="font-screen-title text-screen-title text-on-surface mb-xs">{user.fullName}</h2>
<span className="px-3 py-1 bg-tertiary-container/20 text-tertiary font-caption text-caption rounded-full border border-tertiary/30 mb-md uppercase tracking-wider">{user.role}</span>
<p className="text-on-surface-variant font-body-compact text-body-compact mb-lg">{user.email}</p>
<div className="w-full grid grid-cols-2 gap-sm">
<div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
<p className="text-on-surface-variant font-caption text-caption uppercase">Joined</p>
<p className="font-label-medium text-label-medium text-on-surface">{new Date(user.createdAt).toLocaleDateString()}</p>
</div>
<div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
<p className="text-on-surface-variant font-caption text-caption uppercase">Status</p>
<p className="font-label-medium text-label-medium text-on-surface">{user.isActive ? 'Active' : 'Suspended'}</p>
</div>
</div>
</div>
<div className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header text-on-surface mb-md border-b border-outline-variant pb-sm">Security Controls</h3>
<div className="flex flex-col gap-sm">
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-lg border border-outline-variant/50 transition-colors group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary" data-icon="logout">logout</span>
<span className="font-label-medium text-label-medium">Force Session Logout</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-md bg-surface-container-high hover:bg-surface-bright rounded-lg border border-outline-variant/50 transition-colors group">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary" data-icon="vibration">vibration</span>
<span className="font-label-medium text-label-medium">Reset 2FA Token</span>
</div>
<span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform" data-icon="chevron_right">chevron_right</span>
</button>
<button onClick={toggleStatus} className={`w-full flex items-center justify-between p-md ${user.isActive ? 'bg-error-container/20 hover:bg-error-container/30 border-error/30' : 'bg-primary-container/20 hover:bg-primary-container/30 border-primary/30'} rounded-lg border transition-colors group`}>
<div className="flex items-center gap-sm">
<span className={`material-symbols-outlined ${user.isActive ? 'text-error' : 'text-primary'}`} data-icon="person_off">{user.isActive ? 'person_off' : 'person'}</span>
<span className={`font-label-medium text-label-medium ${user.isActive ? 'text-error' : 'text-primary'}`}>{user.isActive ? 'Deactivate Account' : 'Activate Account'}</span>
</div>
<span className={`material-symbols-outlined ${user.isActive ? 'text-error/60' : 'text-primary/60'} group-hover:translate-x-1 transition-transform`} data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</section>
<section className="md:col-span-8 flex flex-col gap-lg">
<div className="bg-surface-container border border-outline-variant rounded-xl p-md">
<h3 className="font-section-header text-section-header text-on-surface mb-xl">Profile Information</h3>
<form className="grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Full Name</label>
<input className="bg-surface-container-highest border border-outline-variant rounded-xl px-md py-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-on-surface font-body-main" type="text" readOnly value={user.fullName}/>
</div>
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Email Address</label>
<input className="bg-surface-container-highest border border-outline-variant rounded-xl px-md py-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-on-surface font-body-main" type="email" readOnly value={user.email}/>
</div>
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Role Management</label>
<div className="relative">
<select value={user.role} onChange={(e) => updateRole(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant rounded-xl px-md py-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-on-surface font-body-main appearance-none">
<option value="admin">Super Admin</option>
<option value="customer">Customer</option>
<option value="vendor">Vendor</option>
<option value="driver">Driver</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" data-icon="keyboard_arrow_down">keyboard_arrow_down</span>
</div>
</div>
<div className="flex flex-col gap-xs">
<label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Assigned Vendor</label>
<div className="relative">
<select className="w-full bg-surface-container-highest border border-outline-variant rounded-xl px-md py-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-on-surface font-body-main appearance-none">
<option>Global Operations</option>
<option>North America Hub</option>
<option>EU Logistics</option>
<option>APAC Distribution</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" data-icon="keyboard_arrow_down">keyboard_arrow_down</span>
</div>
</div>
<div className="md:col-span-2 flex justify-end mt-md">
<button className="bg-primary text-on-primary px-xl py-3 rounded-xl font-label-medium text-label-medium shadow-lg hover:shadow-primary/20 transition-all active:scale-95" type="submit">Update Profile</button>
</div>
</form>
</div>
<div className="bg-surface-container border border-outline-variant rounded-xl p-md overflow-hidden flex flex-col max-h-[500px]">
<div className="flex items-center justify-between mb-md">
<h3 className="font-section-header text-section-header text-on-surface">Activity Log</h3>
<div className="flex gap-2">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="filter_list">filter_list</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="refresh">refresh</button>
</div>
</div>
<div className="overflow-y-auto pr-2 space-y-md">
<div className="flex gap-md p-md bg-surface-container-low border-l-4 border-primary rounded-r-lg">
<div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-primary" data-icon="security_update_good">security_update_good</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-label-medium text-label-medium text-on-surface">Modified User Permissions</h4>
<span className="text-on-surface-variant font-caption text-caption">14 mins ago</span>
</div>
<p className="text-on-surface-variant font-body-compact text-body-compact">Updated access level for user <span className="text-secondary">@j.smith</span> from 'Support' to 'Manager'</p>
</div>
</div>
<div className="flex gap-md p-md bg-surface-container-low border-l-4 border-secondary rounded-r-lg">
<div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-secondary" data-icon="store">store</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-label-medium text-label-medium text-on-surface">Vendor Assignment Change</h4>
<span className="text-on-surface-variant font-caption text-caption">2 hours ago</span>
</div>
<p className="text-on-surface-variant font-body-compact text-body-compact">Transferred <span className="text-secondary">Urban Eats Co.</span> to EU Logistics cluster.</p>
</div>
</div>
<div className="flex gap-md p-md bg-surface-container-low border-l-4 border-tertiary rounded-r-lg">
<div className="flex-shrink-0 w-10 h-10 bg-tertiary/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-tertiary" data-icon="policy">policy</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-label-medium text-label-medium text-on-surface">Security Audit Downloaded</h4>
<span className="text-on-surface-variant font-caption text-caption">Yesterday, 4:12 PM</span>
</div>
<p className="text-on-surface-variant font-body-compact text-body-compact">Generated full Q3 infrastructure compliance report for stakeholder review.</p>
</div>
</div>
<div className="flex gap-md p-md bg-surface-container-low border-l-4 border-error rounded-r-lg">
<div className="flex-shrink-0 w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-error" data-icon="warning">warning</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-label-medium text-label-medium text-on-surface">Forced Account Suspension</h4>
<span className="text-on-surface-variant font-caption text-caption">Oct 24, 11:05 AM</span>
</div>
<p className="text-on-surface-variant font-body-compact text-body-compact">Suspended user <span className="text-secondary">@rogue_access</span> due to multiple failed 2FA attempts from unrecognized IP.</p>
</div>
</div>
<div className="flex gap-md p-md bg-surface-container-low border-l-4 border-outline rounded-r-lg">
<div className="flex-shrink-0 w-10 h-10 bg-outline/10 rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-outline" data-icon="login">login</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-label-medium text-label-medium text-on-surface">System Login</h4>
<span className="text-on-surface-variant font-caption text-caption">Oct 24, 09:00 AM</span>
</div>
<p className="text-on-surface-variant font-body-compact text-body-compact">Session started from Chrome Desktop (MacOS Monterey).</p>
</div>
</div>
</div>
</div>
</section>
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
