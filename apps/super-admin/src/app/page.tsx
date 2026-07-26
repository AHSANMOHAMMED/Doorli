"use client";
import React from 'react';
import Link from 'next/link';

export default function SuperAdminDirectory() {
  const pages = [
    { title: "Doorli Super Admin Dashboard", path: "/doorli-super-admin-dashboard" },
    { title: "Dashboard", path: "/dashboard" },
    { title: "Global Orders (Finalized)", path: "/global-orders-finalized" },
    { title: "Global Orders", path: "/global-orders" },
    { title: "Order Detail", path: "/order-detail" },
    { title: "Vendors Management", path: "/vendors-management" },
    { title: "Vendor Detail", path: "/vendor-detail" },
    { title: "User Management", path: "/user-management" },
    { title: "User Management (Visual Variant)", path: "/user-management-visual-variant" },
    { title: "User Management (Utility Variant)", path: "/user-management-utility-variant" },
    { title: "User Detail", path: "/user-detail" },
    { title: "User Detail (Editorial Variant)", path: "/user-detail-editorial-variant" },
    { title: "User Detail (Dashboard Variant)", path: "/user-detail-dashboard-variant" },
    { title: "Create Admin Entity", path: "/create-admin-entity" },
    { title: "User Permissions & Access", path: "/user-permissions-access" },
    { title: "Active Users Monitoring", path: "/active-users-monitoring" },
    { title: "System Health Matrix", path: "/system-health-matrix" },
    { title: "Global System Status", path: "/global-system-status" },
    { title: "Regional Health Details", path: "/regional-health-details" },
    { title: "Full System Diagnostics", path: "/full-system-diagnostics" },
    { title: "ERP Synchronization Logs", path: "/erp-synchronization-logs" },
    { title: "Regional Security Audits", path: "/regional-security-audits" },
    { title: "Database Optimization Tools", path: "/database-optimization-tools" },
    { title: "Traffic Rerouting Controls", path: "/traffic-rerouting-controls" },
    { title: "System & Broadcasts", path: "/system-broadcasts" },
    { title: "System & Broadcasts (Finalized)", path: "/system-broadcasts-finalized" },
    { title: "Maintenance Countdown", path: "/maintenance-countdown" },
    { title: "Active Maintenance Window", path: "/active-maintenance-window" },
    { title: "Schedule Maintenance Window", path: "/schedule-maintenance-window" },
    { title: "System Settings & Profile", path: "/system-settings-profile" },
    { title: "Login", path: "/login" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1] p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="material-symbols-outlined text-[#E63946] text-4xl">security</span>
            <h1 className="text-4xl font-bold tracking-tight">Command Center Directory</h1>
          </div>
          <p className="text-gray-400 text-lg">All 31 generated screens have been successfully ported to Next.js routes.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Link 
              key={page.path} 
              href={page.path}
              className="bg-[#1E1E1E] border border-[#333333] hover:border-[#E63946] rounded-xl p-4 transition-colors group flex items-center justify-between"
            >
              <span className="text-sm font-medium group-hover:text-white transition-colors">{page.title}</span>
              <span className="material-symbols-outlined text-gray-600 group-hover:text-[#E63946] text-sm">arrow_forward</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
