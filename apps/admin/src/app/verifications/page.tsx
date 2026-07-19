'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  addressLine?: string | null;
  user?: { fullName?: string; phone?: string };
};

export default function VerificationsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    adminFetch('/admin/vendors?verified=false')
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
      <h1 className="text-3xl font-bold text-slate-900">Vendor Verifications</h1>
      <p className="text-slate-500">Approve shops before they appear as verified on Doorli.</p>
      {error && <p className="text-amber-600 text-sm">{error}</p>}
      <div className="grid gap-4">
        {vendors.length === 0 && !error && (
          <div className="bg-white rounded-2xl border p-8 text-slate-500">No pending verifications.</div>
        )}
        {vendors.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">{v.businessName}</h3>
              <p className="text-sm text-slate-500 capitalize">{v.category} · {v.user?.fullName} · {v.user?.phone}</p>
              <p className="text-sm text-slate-400 mt-1">{v.addressLine}</p>
            </div>
            <button
              onClick={() => verify(v.id)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
