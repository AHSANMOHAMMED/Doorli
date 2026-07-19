'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Package, Plus, Loader as Loader2 } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number | string;
  category?: string | null;
  stockQuantity?: number;
  isAvailable?: boolean;
};

type Vendor = { id: string; businessName: string };

export default function ProductsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    load();
  }, [authLoading, profile]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const vendorRes = await apiFetch<Vendor>('/vendors/me');
      if (!vendorRes.success || !vendorRes.data) {
        setError(vendorRes.error || 'No vendor profile found for this account');
        setLoading(false);
        return;
      }
      setVendor(vendorRes.data);
      const prods = await apiFetch<{ items: Product[] }>(`/products/vendor/${vendorRes.data.id}`);
      setProducts(prods.data?.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    try {
      const res = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: vendor.id,
          name,
          price: Number(price),
          category,
          unit: 'piece',
          stockQuantity: 100,
          isAvailable: true,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Create failed');
      setName('');
      setPrice('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="animate-spin w-5 h-5" /> Loading products…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6" /> Products
        </h1>
        <p className="text-slate-500">{vendor?.businessName || 'Your catalog'}</p>
      </div>
      {error && <p className="text-amber-600 text-sm">{error}</p>}

      <form onSubmit={addProduct} className="bg-white border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Name
          <input className="block mt-1 border rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-sm">
          Price (LKR)
          <input className="block mt-1 border rounded-lg px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label className="text-sm">
          Category
          <input className="block mt-1 border rounded-lg px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      <div className="bg-white border rounded-2xl divide-y">
        {products.map((p) => (
          <div key={p.id} className="px-4 py-3 flex justify-between">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-slate-500">{p.category}</p>
            </div>
            <p className="font-semibold">LKR {Number(p.price).toLocaleString()}</p>
          </div>
        ))}
        {products.length === 0 && <p className="p-4 text-slate-500">No products yet.</p>}
      </div>
    </div>
  );
}
