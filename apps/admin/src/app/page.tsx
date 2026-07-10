import React from 'react';
import { Store, UserCheck, Car, TrendingUp, AlertCircle, Activity, Box } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 mt-2 text-lg">Monitor the Doorli ecosystem and active microservices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vendors" 
          value="4,209" 
          change="+12% from last month" 
          icon={<Store className="w-5 h-5 text-blue-600" />} 
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="Pending KYC" 
          value="182" 
          change="Requires action" 
          icon={<UserCheck className="w-5 h-5 text-amber-600" />} 
          bgColor="bg-amber-50"
          alert
        />
        <StatCard 
          title="Active Drivers" 
          value="1,490" 
          change="+5% from last week" 
          icon={<Car className="w-5 h-5 text-emerald-600" />} 
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="Total Revenue (30d)" 
          value="$1.2M" 
          change="+18% from last month" 
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />} 
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-slate-500" />
            Infrastructure Status
          </h2>
          
          <div className="space-y-4">
            <ServiceStatus name="Marketplace API Gateway" port="4000" status="healthy" latency="42ms" />
            <ServiceStatus name="SaaS ERP Next.js" port="3000" status="healthy" latency="85ms" />
            <ServiceStatus name="Ride-Hailing Socket" port="8085" status="healthy" latency="12ms" />
            <ServiceStatus name="MinIO Storage" port="9000" status="healthy" latency="18ms" />
            <ServiceStatus name="Kafka Event Bus" port="9092" status="warning" latency="240ms" />
            <ServiceStatus name="Elasticsearch Core" port="9200" status="healthy" latency="35ms" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            Action Required
          </h2>
          <div className="space-y-4">
            <ActionItem 
              title="Verify 12 New Restaurants" 
              desc="Business licenses uploaded to MinIO."
              type="urgent"
            />
            <ActionItem 
              title="Review 4 Driver KYC" 
              desc="ID verifications pending manual check."
              type="urgent"
            />
            <ActionItem 
              title="Kafka Replication Lag" 
              desc="Consumer group 'erp-sync' is lagging behind."
              type="warning"
            />
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
        <div className={`p-2 rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        <p className={`text-sm mt-1 font-medium ${alert ? 'text-red-500' : 'text-emerald-500'}`}>
          {change}
        </p>
      </div>
    </div>
  );
}

function ServiceStatus({ name, port, status, latency }: any) {
  const isHealthy = status === 'healthy';
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">Port: {port}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-6">
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latency</p>
          <p className="text-sm font-semibold text-slate-700">{latency}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <p className={`text-sm font-bold capitalize ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ title, desc, type }: any) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition cursor-pointer group">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{title}</h4>
          <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold ${type === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
          {type === 'urgent' ? 'Urgent' : 'Warning'}
        </div>
      </div>
    </div>
  );
}
