'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  city?: string | null;
  isVerified: boolean;
  isOpen: boolean;
  user?: { fullName?: string; phone?: string };
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    adminFetch('/admin/vendors')
      .then(setVendors)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function verify(id: string) {
    await adminFetch(`/admin/vendors/${id}/verify`, { method: 'PATCH' });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
      {error && <p className="text-amber-600 text-sm">{error}</p>}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Business</th>
              <th className="p-4">Category</th>
              <th className="p-4">City</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="p-4 font-medium text-slate-900">
                  {v.businessName}
                  <div className="text-xs text-slate-400">{v.user?.phone}</div>
                </td>
                <td className="p-4 capitalize">{v.category}</td>
                <td className="p-4">{v.city || '—'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${v.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {v.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="p-4">
                  {!v.isVerified && (
                    <button onClick={() => verify(v.id)} className="text-blue-600 font-semibold hover:underline">
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
