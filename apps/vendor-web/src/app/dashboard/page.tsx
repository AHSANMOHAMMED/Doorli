'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface VendorShop {
  id: string;
  businessName: string;
  category: string;
  isOpen: boolean;
  isVerified: boolean;
  _count: { products: number; orders: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [shop, setShop] = useState<VendorShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const res = await apiFetch<VendorShop>('/api/v1/vendors/me/shop');
      setLoading(false);
      if (!res.success || !res.data) {
        if (res.error?.includes('No shop')) {
          router.push('/dashboard/onboarding');
          return;
        }
        setError(res.error ?? 'Failed to load shop');
        return;
      }
      setShop(res.data);
    }
    load();
  }, [router]);

  async function toggleOpen() {
    if (!shop) return;
    const res = await apiFetch<{ isOpen: boolean }>(
      `/api/v1/vendors/${shop.id}/toggle-status`,
      { method: 'PATCH' },
    );
    if (res.success && res.data) {
      setShop({ ...shop, isOpen: res.data.isOpen });
    }
  }

  if (loading) return <p className="text-slate-500">Loading dashboard...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!shop) return null;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{shop.businessName}</h2>
          <p className="text-slate-500 capitalize">{shop.category} · {shop.isVerified ? 'Verified' : 'Pending verification'}</p>
        </div>
        <button
          onClick={toggleOpen}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {shop.isOpen ? 'Open — click to close' : 'Closed — click to open'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={String(shop._count.products)} />
        <StatCard label="Total Orders" value={String(shop._count.orders)} />
        <StatCard label="Status" value={shop.isOpen ? 'Accepting orders' : 'Closed'} />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/products"
            className="rounded-lg bg-doorli-primary px-4 py-2 text-sm font-medium text-white"
          >
            Manage products
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Edit shop details
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
