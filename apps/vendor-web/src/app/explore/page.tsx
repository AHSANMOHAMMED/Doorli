'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import {
  Search,
  Star,
  MapPin,
  Store,
  ShoppingBag,
  Utensils,
  Hotel,
  Calendar,
  Wrench,
  Sparkles,
  Loader as Loader2,
} from 'lucide-react';

type VendorCategory = 'grocery' | 'restaurant' | 'hotel' | 'hall' | 'service' | 'beauty';

type Vendor = {
  id: string;
  businessName: string;
  category: VendorCategory;
  description?: string | null;
  city?: string | null;
  addressLine?: string | null;
  avgRating?: number | string;
  isOpen?: boolean;
  isVerified?: boolean;
};

const CATEGORIES: { key: VendorCategory | 'all'; label: string; icon: typeof Store }[] = [
  { key: 'all', label: 'All', icon: Store },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { key: 'restaurant', label: 'Restaurant', icon: Utensils },
  { key: 'hotel', label: 'Hotel', icon: Hotel },
  { key: 'hall', label: 'Hall', icon: Calendar },
  { key: 'service', label: 'Service', icon: Wrench },
  { key: 'beauty', label: 'Beauty', icon: Sparkles },
];

export default function ExplorePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const path =
          activeCategory === 'all'
            ? '/vendors'
            : `/vendors?category=${encodeURIComponent(activeCategory)}`;
        const res = await apiFetch<{ items: Vendor[] }>(path);
        setVendors(res.data?.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vendors');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCategory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q),
    );
  }, [vendors, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Explore</h1>
            <p className="text-slate-500 mt-1">Browse local shops on Doorli</p>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 font-medium">
            Dashboard →
          </Link>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full border rounded-xl pl-10 pr-4 py-3 bg-white"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCategory(c.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                  active ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {c.label}
              </button>
            );
          })}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">No vendors found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((v) => (
              <Link
                key={v.id}
                href={`/explore/${v.id}`}
                className="bg-white border rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{v.businessName}</h2>
                    <p className="text-sm text-slate-500 capitalize mt-1">{v.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {Number(v.avgRating || 0) > 0 ? Number(v.avgRating).toFixed(1) : 'New'}
                  </div>
                </div>
                {(v.city || v.addressLine) && (
                  <p className="text-sm text-slate-500 mt-3 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {v.city || v.addressLine}
                  </p>
                )}
                <p className="text-xs mt-3 text-slate-400">
                  {v.isOpen === false ? 'Closed' : 'Open'} · {v.isVerified ? 'Verified' : 'Unverified'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
