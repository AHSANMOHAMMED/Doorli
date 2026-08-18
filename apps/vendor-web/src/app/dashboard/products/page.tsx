'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Package, Plus, Search } from 'lucide-react';
import { PageHeader, Panel, EmptyState, LoadingBlock, ErrorNote, Badge } from '@/components/console';

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
  const [unit, setUnit] = useState('piece');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

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
          unit,
          stockQuantity: Number(stockQuantity),
          isAvailable,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Create failed');
      setName('');
      setPrice('');
      setStockQuantity('0');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <PageHeader title="Products" subtitle="Loading your catalogue…" />
        <LoadingBlock rows={4} />
      </>
    );
  }

  const filtered = products.filter((p) =>
    query.trim() ? p.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={vendor?.businessName || 'Your catalogue'}
        actions={<Badge tone="info">{products.length} items</Badge>}
      />

      {error && <div className="flex flex-wrap items-center gap-3"><ErrorNote>{error}</ErrorNote><button type="button" className="btn btn-ghost" onClick={() => void load()}>Retry</button></div>}

      <Panel title="Add a product" icon={<Plus size={17} />}>
        <form onSubmit={addProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-doorli-muted">Name</span>
            <input
              className="w-full px-3 py-2.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chicken kottu"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-doorli-muted">Unit</span>
            <select className="w-full px-3 py-2.5 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="piece">Piece</option><option value="kg">Kilogram</option><option value="litre">Litre</option><option value="box">Box</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-doorli-muted">Opening stock</span>
            <input className="w-full px-3 py-2.5 text-sm" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} inputMode="numeric" min="0" type="number" />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-doorli-muted">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} /> Available now
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-doorli-muted">Price (LKR)</span>
            <input
              className="w-full px-3 py-2.5 text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="850"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-doorli-muted">Category</span>
            <input
              className="w-full px-3 py-2.5 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-gradient-to-r from-[#185fa5] to-[#1d9e75] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#185fa5]/25 transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
      </Panel>

      {products.length > 0 && (
        <div className="relative max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-doorli-dim" />
          <input
            className="w-full py-2.5 pl-10 pr-3 text-sm"
            placeholder="Search catalogue…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={20} />}
          title={products.length === 0 ? 'No products yet' : 'Nothing matches that search'}
          desc={
            products.length === 0
              ? 'Add your first item above and it will appear in the marketplace straight away.'
              : 'Try a different product name.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <article key={p.id} className="console-panel console-panel-hover flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">{p.name}</h3>
                  <p className="mt-0.5 text-xs capitalize text-doorli-dim">{p.category || 'general'}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-doorli-muted">
                  <Package size={16} />
                </span>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3">
                <p className="font-display text-lg font-bold text-white">
                  LKR {Number(p.price).toLocaleString()}
                </p>
                <Badge tone={p.isAvailable === false ? 'neutral' : 'success'}>
                  {p.isAvailable === false ? 'Hidden' : 'Live'}
                </Badge>
              </div>
              {typeof p.stockQuantity === 'number' && (
                <p className="text-xs text-doorli-dim">{p.stockQuantity} in stock</p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
