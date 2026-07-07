'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Vendor, VendorCategory, Profile } from '@/lib/types';
import { Store, Search, Star, Eye, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface VendorWithOwner extends Vendor {
  profiles?: Pick<Profile, 'full_name'> | null;
}

const CATEGORIES: VendorCategory[] = [
  'grocery',
  'restaurant',
  'hotel',
  'hall',
  'service',
  'beauty',
];

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  grocery: 'Grocery',
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  hall: 'Hall',
  service: 'Service',
  beauty: 'Beauty',
};

export default function VendorsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendors, setVendors] = useState<VendorWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    if (isAdmin) loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadVendors() {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('vendors')
        .select('*, profiles!vendors_user_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVendors((data ?? []) as VendorWithOwner[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load vendors';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVerified(vendor: VendorWithOwner) {
    setUpdatingId(vendor.id);
    try {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          is_verified: !vendor.is_verified,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendor.id ? { ...v, is_verified: !v.is_verified } : v,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update vendor';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleOpen(vendor: VendorWithOwner) {
    setUpdatingId(vendor.id);
    try {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          is_open: !vendor.is_open,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, is_open: !v.is_open } : v)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update vendor';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  // Filtered vendors based on search + category
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search ||
        v.business_name.toLowerCase().includes(search.toLowerCase()) ||
        (v.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (v.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || v.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [vendors, search, categoryFilter]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 mt-2">
          You do not have permission to access this page. Admin access required.
        </p>
        <Link href="/dashboard" className="btn-secondary mt-6 inline-flex items-center gap-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Management</h1>
        <p className="text-slate-500 mt-1">
          Verify and manage all vendors on the platform
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, city, or owner..."
            className="input pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABEL[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Vendors</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{vendors.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Verified</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {vendors.filter((v) => v.is_verified).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Open Now</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {vendors.filter((v) => v.is_open).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Vendors table */}
      {filteredVendors.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No vendors found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Business</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Owner</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Category</th>
                  <th className="px-6 py-3 font-medium text-slate-600">City</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Verified</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Rating</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Reviews</th>
                  <th className="px-6 py-3 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {vendor.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <span className="font-medium text-slate-900">
                          {vendor.business_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {vendor.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-info capitalize">
                        {CATEGORY_LABEL[vendor.category] ?? vendor.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{vendor.city ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${vendor.is_open ? 'badge-success' : 'badge-neutral'}`}>
                        {vendor.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${vendor.is_verified ? 'badge-success' : 'badge-warning'}`}>
                        {vendor.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-slate-900">
                          {vendor.avg_rating > 0 ? vendor.avg_rating.toFixed(1) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{vendor.total_reviews}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/vendors/${vendor.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleVerified(vendor)}
                          disabled={updatingId === vendor.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            vendor.is_verified
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={vendor.is_verified ? 'Unverify vendor' : 'Verify vendor'}
                        >
                          {updatingId === vendor.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : vendor.is_verified ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleOpen(vendor)}
                          disabled={updatingId === vendor.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            vendor.is_open
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={vendor.is_open ? 'Close vendor' : 'Open vendor'}
                        >
                          {updatingId === vendor.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Store className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
