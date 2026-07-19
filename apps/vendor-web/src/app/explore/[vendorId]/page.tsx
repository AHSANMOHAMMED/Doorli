'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getExploreCart, addToExploreCart } from '@/lib/explore-cart';
import { ArrowLeft, Loader as Loader2, Plus, ShoppingBag, Star } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number | string;
  description?: string | null;
  category?: string | null;
  isAvailable?: boolean;
};

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  avgRating?: number | string;
  products?: Product[];
};

export default function ExploreVendorPage() {
  const params = useParams();
  const vendorId = String(params.vendorId);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<Vendor>(`/vendors/${vendorId}`);
        if (!res.success || !res.data) throw new Error(res.error || 'Vendor not found');
        setVendor(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
    setCartCount(getExploreCart().reduce((s, i) => s + i.quantity, 0));
  }, [vendorId]);

  const products = useMemo(
    () => (vendor?.products || []).filter((p) => p.isAvailable !== false),
    [vendor],
  );

  function add(product: Product) {
    if (!vendor) return;
    addToExploreCart({
      productId: product.id,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
    });
    setCartCount(getExploreCart().reduce((s, i) => s + i.quantity, 0));
  }

  if (loading) {
    return (
      <div className="p-10 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-10">
        <p className="text-red-600">{error || 'Not found'}</p>
        <Link href="/explore" className="underline mt-4 inline-block">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-slate-600">
            <ArrowLeft className="w-4 h-4" /> Explore
          </Link>
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShoppingBag className="w-4 h-4" /> Cart ({cartCount})
          </Link>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <h1 className="text-2xl font-bold">{vendor.businessName}</h1>
          <p className="text-slate-500 capitalize mt-1">{vendor.category}</p>
          <div className="flex items-center gap-1 text-amber-500 text-sm mt-2">
            <Star className="w-4 h-4 fill-amber-400" />
            {Number(vendor.avgRating || 0) > 0 ? Number(vendor.avgRating).toFixed(1) : 'New'}
          </div>
          {vendor.description && <p className="text-slate-600 mt-4">{vendor.description}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {['hotel', 'hall', 'beauty'].includes(vendor.category) && (
              <Link href={`/explore/${vendor.id}/book`} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">
                Book
              </Link>
            )}
            {vendor.category === 'service' && (
              <Link href={`/explore/${vendor.id}/request`} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                Request service
              </Link>
            )}
            <Link href={`/explore/${vendor.id}/review`} className="px-3 py-1.5 rounded-lg border">
              Leave review
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Products</h2>
          {products.length === 0 ? (
            <p className="text-slate-500 text-sm">No products listed.</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.description && <p className="text-sm text-slate-500 mt-1">{p.description}</p>}
                  <div className="text-blue-600 font-semibold mt-2">LKR {Number(p.price).toFixed(0)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => add(p)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
