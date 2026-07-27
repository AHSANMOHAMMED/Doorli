'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  UserCheck,
  Car,
  TrendingUp,
  AlertCircle,
  Activity,
  ArrowUpRight,
  Building2,
  Boxes,
  Server,
} from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, Panel, StatCard, Badge, EmptyState, Skeleton } from '@/components/ui';

type InfraService = { name: string; port: string; status: string; url?: string };

type Stats = {
  totalVendors: number;
  pendingKyc: number;
  activeDrivers: number;
  ordersToday: number;
  revenue30d: number;
  simpleVendors?: number;
  enterpriseVendors?: number;
  erpProvisionFailed?: number;
  erpSyncFailed?: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalVendors: 0,
    pendingKyc: 0,
    activeDrivers: 0,
    ordersToday: 0,
    revenue30d: 0,
  });
  const [infra, setInfra] = useState<InfraService[]>([]);
  const [loadingInfra, setLoadingInfra] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
      return;
    }
    adminFetch('/admin/stats')
      .then(setStats)
      .catch((e) => {
        setError(e.message);
        if (String(e.message).toLowerCase().includes('unauthorized') || String(e.message).includes('401')) {
          router.replace('/login');
        }
      });
    adminFetch('/admin/infra')
      .then((data: { services: InfraService[] }) => setInfra(data.services || []))
      .catch(() => setInfra([]))
      .finally(() => setLoadingInfra(false));
  }, [router]);

  const erpServices = infra.filter((s) => /erp/i.test(s.name));
  const coreServices = infra.filter((s) => !/erp/i.test(s.name));

  return (
    <>
      <PageHeader
        title="Super Admin Overview"
        subtitle="One control plane for the Doorli marketplace and both ERP backends."
        actions={
          <Link href="/vendors" className="btn btn-primary">
            Create vendor
            <ArrowUpRight size={16} />
          </Link>
        }
      />

      {error && (
        <div className="glass-card border-[rgba(250,199,117,0.3)] px-4 py-3 text-sm text-doorli-gold">
          API: {error} —{' '}
          <Link className="underline underline-offset-2" href="/login">
            sign in again
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-slide-up">
        <StatCard
          label="Total Vendors"
          value={stats.totalVendors}
          hint="All registered shops"
          tone="blue"
          delay="doorli-rise"
          icon={<Store size={17} />}
        />
        <StatCard
          label="Pending KYC"
          value={stats.pendingKyc}
          hint="Awaiting verification"
          tone="gold"
          delay="doorli-rise-1"
          icon={<UserCheck size={17} />}
        />
        <StatCard
          label="Active Drivers"
          value={stats.activeDrivers}
          hint="Currently online"
          tone="teal"
          delay="doorli-rise-2"
          icon={<Car size={17} />}
        />
        <StatCard
          label="Revenue (30d)"
          value={`LKR ${Number(stats.revenue30d).toLocaleString()}`}
          hint={`${stats.ordersToday} orders today`}
          tone="rose"
          delay="doorli-rise-3"
          icon={<TrendingUp size={17} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <StatCard
          label="Retail Smart vendors"
          value={stats.simpleVendors ?? 0}
          hint="simple ERP tier"
          tone="teal"
          icon={<Boxes size={17} />}
        />
        <StatCard
          label="Enterprise vendors"
          value={stats.enterpriseVendors ?? 0}
          hint="Frappe companies"
          tone="gold"
          icon={<Server size={17} />}
        />
        <StatCard
          label="ERP issues"
          value={(stats.erpProvisionFailed ?? 0) + (stats.erpSyncFailed ?? 0)}
          hint={`${stats.erpProvisionFailed ?? 0} provision · ${stats.erpSyncFailed ?? 0} sync`}
          tone="rose"
          icon={<Building2 size={17} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Panel
            title="Infrastructure Status"
            icon={<Activity size={17} />}
            className="lg:col-span-2 hover:scale-[1.01] transition-transform"
            actions={
              infra.length > 0 && (
                <Badge tone={infra.every((s) => s.status === 'healthy') ? 'success' : 'warning'}>
                  {infra.filter((s) => s.status === 'healthy').length}/{infra.length} healthy
                </Badge>
              )
            }
          >
            <div className="space-y-3">
              {loadingInfra ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : infra.length === 0 ? (
                <EmptyState
                  icon={<Activity size={20} />}
                  title="No service health yet"
                  desc="Sign in to load live status for the API, database, and ERP services."
                />
              ) : (
                <>
                  {erpServices.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-doorli-dim">ERP backends</p>
                  )}
                  {erpServices.map((s) => (
                    <ServiceRow key={s.name} {...s} />
                  ))}
                  {coreServices.length > 0 && (
                    <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-doorli-dim">
                      Marketplace services
                    </p>
                  )}
                  {coreServices.map((s) => (
                    <ServiceRow key={s.name} {...s} />
                  ))}
                </>
              )}
            </div>
          </Panel>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <Panel title="Action Required" icon={<AlertCircle size={17} />} className="hover:scale-[1.01] transition-transform">
            <div className="space-y-3">
              <ActionItem
                href="/verifications"
                title={`Verify ${stats.pendingKyc} vendor${stats.pendingKyc === 1 ? '' : 's'}`}
                desc="Approve shops waiting on KYC."
                tone={stats.pendingKyc > 0 ? 'danger' : 'success'}
                label={stats.pendingKyc > 0 ? 'Urgent' : 'Clear'}
              />
              <ActionItem
                href="/tenants"
                title={
                  (stats.erpProvisionFailed ?? 0) + (stats.erpSyncFailed ?? 0) > 0
                    ? `Fix ${(stats.erpProvisionFailed ?? 0) + (stats.erpSyncFailed ?? 0)} ERP issue(s)`
                    : 'ERP tenants healthy'
                }
                desc="Provision failures and order sync errors."
                tone={(stats.erpProvisionFailed ?? 0) + (stats.erpSyncFailed ?? 0) > 0 ? 'danger' : 'success'}
                label="ERP"
              />
              <ActionItem
                href="/health"
                title="System health"
                desc="Probe API, Retail Smart, and Enterprise."
                tone="info"
                label="Live"
              />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function ServiceRow({ name, port, status }: InfraService) {
  const healthy = status === 'healthy';
  const down = status === 'down';
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <span className="relative flex h-2.5 w-2.5">
          {healthy && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1d9e75] opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              healthy ? 'bg-[#5dcaa5]' : down ? 'bg-[#f2668b]' : 'bg-[#fac775]'
            }`}
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-doorli-dim">{port !== '—' ? `Port ${port}` : 'Not configured'}</p>
        </div>
      </div>
      <Badge tone={healthy ? 'success' : down ? 'danger' : 'warning'}>{status}</Badge>
    </div>
  );
}

function ActionItem({
  href,
  title,
  desc,
  tone,
  label,
}: {
  href: string;
  title: string;
  desc: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-doorli-mint">{title}</p>
        <p className="mt-1 text-xs text-doorli-dim">{desc}</p>
      </div>
      <Badge tone={tone}>{label}</Badge>
    </Link>
  );
}
