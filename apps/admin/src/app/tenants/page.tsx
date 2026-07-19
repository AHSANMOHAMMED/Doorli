'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  erpTenantId?: string | null;
  isVerified: boolean;
  city?: string | null;
};

export default function Tenants() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
      return;
    }
    adminFetch('/admin/vendors')
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setVendors(list.filter((v: Vendor) => v.erpTenantId));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">ERP Tenants</h2>
        <p className="text-gray-500 mt-2">
          Vendors linked to Retail Smart ERP (`erpTenantId`). Full ERP admin lives in the ERP app.
        </p>
      </div>
      {error && <p className="text-amber-600 text-sm">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">ERP Tenant ID</th>
                <th className="px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{v.businessName}</td>
                  <td className="px-4 py-3 capitalize">{v.category}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.erpTenantId}</td>
                  <td className="px-4 py-3">{v.isVerified ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No vendors with an ERP tenant link yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
