'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Vendor, VendorCategory } from '@/lib/types';
import { Search, Star, MapPin, Store, ShoppingBag, Utensils, Hotel, Calendar, Wrench, Sparkles, Loader as Loader2, ArrowLeft } from 'lucide-react';

const CATEGORIES: { key: VendorCategory | 'all'; label: string; icon: typeof Store }[] = [
  { key: 'all', label: 'All', icon: Store },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { key: 'restaurant', label: 'Restaurant', icon: Utensils },
  { key: 'hotel', label: 'Hotel', icon: Hotel },
  { key: 'hall', label: 'Hall', icon: Calendar },
  { key: 'service', label: 'Service', icon: Wrench },
  { key: 'beauty', label: 'Beauty', icon: Sparkles },
];

const CATEGORY_ICONS: Record<VendorCategory, typeof Store> = {
  grocery: ShoppingBag,
  restaurant: Utensils,
  hotel: Hotel,
  hall: Calendar,
  service: Wrench,
  beauty: Sparkles,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-500">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
    </div>
  );
}

export default function ExplorePage() {
  const supabase = createClient();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all');

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setVendors((data ?? []) as Vendor[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load vendors';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesCategory =
        activeCategory === 'all' || v.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.business_name.toLowerCase().includes(q) ||
        (v.city ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [vendors, activeCategory, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Doorli</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/orders"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/cart"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cart
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero search */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Explore Local Vendors
            </h1>
            <p className="mt-3 text-blue-50">
              Discover grocery, restaurants, hotels, services, and more near you.
            </p>
            <div className="mt-6 relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name or city..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-md p-3 border border-slate-100">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No vendors found</h3>
            <p className="mt-1 text-slate-500">
              {search || activeCategory !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Check back soon — new vendors are joining all the time.'}
            </p>
            {(search || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="btn-secondary mt-4 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => {
                const CatIcon = CATEGORY_ICONS[vendor.category] ?? Store;
                return (
                  <Link
                    key={vendor.id}
                    href={`/explore/${vendor.id}`}
                    className="card overflow-hidden hover:shadow-md transition-shadow group animate-fade-in"
                  >
                    {/* Banner / logo area */}
                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                      {vendor.banner_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vendor.banner_url}
                          alt={vendor.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CatIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {vendor.is_open ? (
                          <span className="badge badge-success">Open</span>
                        ) : (
                          <span className="badge badge-neutral">Closed</span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {vendor.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {vendor.business_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge badge-neutral capitalize">
                              {vendor.category}
                            </span>
                            {vendor.is_verified && (
                              <span className="badge badge-info">Verified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {vendor.description && (
                        <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                          {vendor.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <StarRating rating={vendor.avg_rating} />
                        {vendor.city && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {vendor.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
