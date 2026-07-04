'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: string;
  unit: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  category: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', unit: 'piece', stockQuantity: '10', category: '' });

  async function loadProducts() {
    const res = await apiFetch<Product[]>('/api/v1/products/my');
    setLoading(false);
    if (res.success && res.data) setProducts(res.data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch<Product>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        unit: form.unit,
        stockQuantity: parseInt(form.stockQuantity, 10),
        category: form.category || undefined,
      }),
    });
    if (res.success) {
      setShowForm(false);
      setForm({ name: '', price: '', unit: 'piece', stockQuantity: '10', category: '' });
      loadProducts();
    }
  }

  async function toggleAvailable(id: string) {
    await apiFetch(`/api/v1/products/${id}/toggle-available`, { method: 'PATCH' });
    loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    await apiFetch(`/api/v1/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  if (loading) return <p className="text-slate-500">Loading products...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-doorli-primary px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? 'Cancel' : 'Add product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
          <input required placeholder="Product name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Price (LKR)" type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Unit (kg, piece)" className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input required placeholder="Stock" type="number" className="input" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          <input placeholder="Category" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <button type="submit" className="rounded-lg bg-doorli-primary py-2 font-medium text-white sm:col-span-2">Save product</button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No products yet</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">LKR {p.price}</td>
                  <td className="px-4 py-3">{p.stockQuantity} {p.unit}</td>
                  <td className="px-4 py-3">
                    <span className={p.isAvailable ? 'text-green-600' : 'text-slate-400'}>
                      {p.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => toggleAvailable(p.id)} className="text-doorli-primary hover:underline">Toggle</button>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; }`}</style>
    </div>
  );
}
