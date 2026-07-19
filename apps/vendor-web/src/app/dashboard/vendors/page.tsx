'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Store, Loader as Loader2 } from 'lucide-react';

type VendorRow = {
  id: string;
  businessName: string;
  category: string;
  city?: string | null;
  isVerified: boolean;
  isOpen: boolean;
  avgRating?: number | string;
};

export default function VendorsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        const res = await apiFetch<{ items?: VendorRow[] } | VendorRow[]>('/admin/vendors');
        const data = res.data;
        setVendors(Array.isArray(data) ? data : data?.items ?? []);
      } else {
        const res = await apiFetch<{ items: VendorRow[] }>('/vendors');
        setVendors(res.data?.items ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    void load();
  }, [authLoading, user]);

  async function verify(id: string) {
    setUpdatingId(id);
    try {
      const res = await apiFetch(`/admin/vendors/${id}/verify`, { method: 'PATCH' });
      if (!res.success) throw new Error(res.error || 'Verify failed');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading vendors...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Store className="w-6 h-6" /> Vendors
      </h1>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="px-4 py-3 font-medium">{v.businessName}</td>
                <td className="px-4 py-3 capitalize">{v.category}</td>
                <td className="px-4 py-3">{v.city ?? '—'}</td>
                <td className="px-4 py-3">{v.isVerified ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  {user?.role === 'admin' && !v.isVerified && (
                    <button
                      type="button"
                      disabled={updatingId === v.id}
                      onClick={() => verify(v.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
