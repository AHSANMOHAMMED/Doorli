'use client';

import React, { useEffect, useState } from 'react';
import { Store, UserCheck, Car, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { adminFetch } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingKyc: 0,
    activeDrivers: 0,
    ordersToday: 0,
    revenue30d: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 mt-2 text-lg">Live Doorli marketplace metrics from the API.</p>
        {error && <p className="text-amber-600 mt-2 text-sm">API: {error} (set doorli_admin_token in localStorage)</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vendors" value={String(stats.totalVendors)} change="All registered shops" icon={<Store className="w-5 h-5 text-blue-600" />} bgColor="bg-blue-50" />
        <StatCard title="Pending KYC" value={String(stats.pendingKyc)} change="Needs verification" icon={<UserCheck className="w-5 h-5 text-amber-600" />} bgColor="bg-amber-50" alert />
        <StatCard title="Active Drivers" value={String(stats.activeDrivers)} change="Currently online" icon={<Car className="w-5 h-5 text-emerald-600" />} bgColor="bg-emerald-50" />
        <StatCard title="Revenue (30d)" value={`LKR ${Number(stats.revenue30d).toLocaleString()}`} change={`${stats.ordersToday} orders today`} icon={<TrendingUp className="w-5 h-5 text-purple-600" />} bgColor="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-slate-500" />
            Infrastructure Status
          </h2>
          <div className="space-y-4">
            <ServiceStatus name="Marketplace API Gateway" port="4000" status="healthy" />
            <ServiceStatus name="Notifications Worker" port="—" status="healthy" />
            <ServiceStatus name="Ride-Hailing Socket" port="8085" status="healthy" />
            <ServiceStatus name="Search (Elasticsearch)" port="4004" status="healthy" />
            <ServiceStatus name="MinIO Storage" port="9000" status="healthy" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            Action Required
          </h2>
          <div className="space-y-4">
            <ActionItem title={`Verify ${stats.pendingKyc} vendors`} desc="Open Verifications to approve shops." type="urgent" />
            <ActionItem title="Review driver fleet" desc="Check online drivers and earnings." type="warning" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, bgColor, alert }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${bgColor}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        <p className={`text-sm mt-1 font-medium ${alert ? 'text-red-500' : 'text-emerald-500'}`}>{change}</p>
      </div>
    </div>
  );
}

function ServiceStatus({ name, port, status }: any) {
  const isHealthy = status === 'healthy';
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">Port: {port}</p>
        </div>
      </div>
      <p className={`text-sm font-bold capitalize ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</p>
    </div>
  );
}

function ActionItem({ title, desc, type }: any) {
  return (
    <div className="p-4 rounded-xl border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold ${type === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
          {type === 'urgent' ? 'Urgent' : 'Warning'}
        </div>
      </div>
    </div>
  );
}
