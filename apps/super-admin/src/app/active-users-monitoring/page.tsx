"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function ActiveUsersMonitoringPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await superAdminFetch('/admin/users');
      if (res.success) {
        setUsers(res.data.filter((u: any) => u.isActive));
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const killSession = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this user session?')) return;
    try {
      const res = await superAdminFetch(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false })
      });
      if (res.success) {
        alert('Session Terminated');
        fetchUsers();
      }
    } catch (err) {
      alert('Error terminating session');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  TopAppBar  */}
<header className="w-full top-0 sticky bg-background dark:bg-background border-b border-surface-variant dark:border-surface-variant z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full">
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">menu</button>
<h1 className="font-screen-title text-screen-title font-bold text-primary">Doorli Super Admin</h1>
</div>
<div className="flex items-center gap-2">
<div className="hidden md:flex items-center bg-surface-container rounded-full px-4 py-1 border border-outline-variant mr-4">
<span className="w-2 h-2 bg-tertiary rounded-full pulse-ring mr-2"></span>
<span className="font-label-medium text-label-medium text-tertiary">System Health: Stable</span>
</div>
<button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">notifications</button>
</div>
</header>
<main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-24 md:pb-lg">
{/*  Live Pulse Section  */}
<section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-lg">
<div className="md:col-span-8 relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-lg flex flex-col justify-between min-h-[180px]">
<div className="z-10">
<h2 className="font-section-header text-section-header text-on-surface-variant mb-base">Live Pulse</h2>
<div className="flex items-baseline gap-xs">
<span className="font-kpi-number text-kpi-number text-white" id="active-connections">{users.length}</span>
<span className="font-label-medium text-label-medium text-tertiary flex items-center gap-1">
                        </span>
</div>
<p className="font-caption text-caption text-outline mt-xs uppercase tracking-wider">Total Active Global Connections</p>
</div>
{/*  Mini visualizer effect  */}
<div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-between px-xs opacity-30">
<div className="w-2 bg-primary h-4 rounded-t-sm"></div>
<div className="w-2 bg-primary h-8 rounded-t-sm"></div>
<div className="w-2 bg-primary h-6 rounded-t-sm"></div>
<div className="w-2 bg-primary h-12 rounded-t-sm"></div>
<div className="w-2 bg-primary h-10 rounded-t-sm"></div>
<div className="w-2 bg-primary h-14 rounded-t-sm"></div>
<div className="w-2 bg-primary h-8 rounded-t-sm"></div>
<div className="w-2 bg-primary h-10 rounded-t-sm"></div>
<div className="w-2 bg-primary h-12 rounded-t-sm"></div>
<div className="w-2 bg-primary h-16 rounded-t-sm"></div>
<div className="w-2 bg-primary h-14 rounded-t-sm"></div>
<div className="w-2 bg-primary h-12 rounded-t-sm"></div>
<div className="w-2 bg-primary h-10 rounded-t-sm"></div>
<div className="w-2 bg-primary h-8 rounded-t-sm"></div>
</div>
</div>
<div className="md:col-span-4 rounded-xl border border-outline-variant bg-surface-container p-lg">
<h3 className="font-section-header text-section-header text-on-surface-variant mb-md">Quick Filter</h3>
<div className="space-y-sm">
<div className="relative">
<input className="w-full bg-surface-container-high border-none rounded-xl text-body-compact font-body-compact text-on-surface p-3 pl-10 focus:ring-1 focus:ring-secondary" placeholder="Search by Username/IP..." type="text"/>
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
</div>
<div className="flex gap-2">
<button className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full font-label-medium text-label-medium">All Roles</button>
<button className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-full font-label-medium text-label-medium hover:bg-surface-container-highest transition-colors">Critical</button>
<button className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-full font-label-medium text-label-medium hover:bg-surface-container-highest transition-colors">Admin Only</button>
</div>
</div>
</div>
</section>
{/*  Monitoring List  */}
<section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-md">
<div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
<h3 className="font-section-header text-section-header text-white flex items-center gap-2">
<span className="material-symbols-outlined text-secondary">monitor_heart</span>
                    Real-time User Activity
                </h3>
<div className="text-caption font-caption text-outline">
                    Sync interval: <span className="text-tertiary">3s</span>
</div>
</div>
{/*  Table Container  */}
<div className="overflow-x-auto custom-scrollbar">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container text-outline uppercase font-caption text-caption border-b border-outline-variant">
<th className="px-md py-4 font-medium">User Entity</th>
<th className="px-md py-4 font-medium">Access Role</th>
<th className="px-md py-4 font-medium">Network Data</th>
<th className="px-md py-4 font-medium">Last Activity</th>
<th className="px-md py-4 font-medium text-right">System Control</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant">
{loading ? (
  <tr><td colSpan={5} className="p-4 text-center text-on-surface-variant">Loading active users...</td></tr>
) : users.length === 0 ? (
  <tr><td colSpan={5} className="p-4 text-center text-on-surface-variant">No active users</td></tr>
) : (
  users.map(user => (
    <tr key={user.id} className="bg-surface-dim hover:bg-surface-container-high transition-colors group">
      <td className="px-md py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-highest flex-shrink-0 flex items-center justify-center font-bold text-xl text-primary">
            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-body-main text-body-main text-white font-semibold">{user.fullName || user.email}</div>
            <div className="font-caption text-caption text-outline">Session ID: #{user.id.substring(0, 8)}</div>
          </div>
        </div>
      </td>
      <td className="px-md py-4">
        <span className="px-3 py-1 rounded-full font-label-medium text-label-medium bg-primary-container/20 text-primary border border-primary/30 uppercase">{user.role}</span>
      </td>
      <td className="px-md py-4">
        <div className="flex flex-col">
          <span className="font-body-compact text-body-compact text-secondary">N/A</span>
        </div>
      </td>
      <td className="px-md py-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
          <span className="font-body-compact text-body-compact text-on-surface">Active</span>
        </div>
      </td>
      <td className="px-md py-4 text-right">
        <button className="px-4 py-2 rounded-xl font-label-medium text-label-medium text-on-primary-container bg-primary-container hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 ml-auto" onClick={() => killSession(user.id)}>
          <span className="material-symbols-outlined text-[18px]">terminal</span> Force Kill
        </button>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
<div className="p-md border-t border-outline-variant bg-surface-container flex flex-col md:flex-row justify-between items-center gap-md">
<div className="font-caption text-caption text-outline">Showing {users.length} active sessions</div>
<div className="flex items-center gap-2">
<button className="p-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50" disabled>
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="px-3 py-1 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium">1</button>
<button className="px-3 py-1 rounded-lg bg-surface-container-high text-on-surface font-label-medium text-label-medium hover:bg-surface-variant transition-colors">2</button>
<button className="px-3 py-1 rounded-lg bg-surface-container-high text-on-surface font-label-medium text-label-medium hover:bg-surface-variant transition-colors">3</button>
<button className="p-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</section>
</main>
{/*  BottomNavBar  */}
<nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container border-t border-surface-variant dark:border-surface-variant shadow-md flex justify-around items-center h-16 w-full px-2 pb-safe md:hidden">
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-label-medium text-label-medium">Dashboard</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/vendors-management">
<span className="material-symbols-outlined">store</span>
<span className="font-label-medium text-label-medium">Vendors</span>
</a>
<a className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-on-primary-container dark:text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="/active-users-monitoring">
<span className="material-symbols-outlined">group</span>
<span className="font-label-medium text-label-medium">Users</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/global-orders-finalized">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="font-label-medium text-label-medium">Orders</span>
</a>
<a className="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150" href="/system-settings-profile">
<span className="material-symbols-outlined">more_horiz</span>
<span className="font-label-medium text-label-medium">More</span>
</a>
</nav>
{/*  Success Toast (Hidden)  */}
<div className="fixed top-20 right-6 translate-x-[150%] transition-transform duration-300 z-[100] bg-surface-container-highest border border-tertiary/30 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4" id="toast">
<div className="bg-tertiary/20 text-tertiary p-2 rounded-full">
<span className="material-symbols-outlined">check_circle</span>
</div>
<div>
<div className="font-body-main text-body-main text-white font-bold">Session Terminated</div>
<div className="font-caption text-caption text-outline">User access revoked and connection killed.</div>
</div>
</div>


    </div>
  );
}
