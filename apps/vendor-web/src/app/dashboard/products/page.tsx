'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Product, Vendor, VendorCategory } from '@/lib/types';
import { Package, Plus, Pencil, Trash2, X, Loader as Loader2, Image as ImageIcon } from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  category: string;
  price: string;
  discount_price: string;
  unit: string;
  stock_quantity: string;
  image_url: string;
  is_available: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  category: '',
  price: '',
  discount_price: '',
  unit: 'piece',
  stock_quantity: '0',
  image_url: '',
  is_available: true,
};

const CATEGORIES: VendorCategory[] = [
  'grocery',
  'restaurant',
  'hotel',
  'hall',
  'service',
  'beauty',
];

export default function ProductsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      let vendorId: string | null = null;

      if (!isAdmin) {
        // Find the vendor record for this user
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', profile!.id)
          .maybeSingle();

        if (vendorError) throw vendorError;
        if (!vendorData) {
          setError('No vendor profile found. Please complete onboarding first.');
          setLoading(false);
          return;
        }
        vendorId = (vendorData as Vendor).id;
        setVendor(vendorData as Vendor);
      }

      const productsQuery = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorId) {
        productsQuery.eq('vendor_id', vendorId);
      }

      const { data, error: productsError } = await productsQuery;

      if (productsError) throw productsError;
      setProducts((data ?? []) as Product[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      category: product.category ?? '',
      price: String(product.price),
      discount_price: product.discount_price ? String(product.discount_price) : '',
      unit: product.unit ?? 'piece',
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url ?? '',
      is_available: product.is_available,
    });
    setFormError('');
    setShowModal(true);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (!vendor) {
        setFormError('No vendor profile found.');
        setSaving(false);
        return;
      }

      const payload = {
        vendor_id: vendor.id,
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        unit: form.unit || null,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        image_url: form.image_url || null,
        is_available: form.is_available,
      };

      if (parseFloat(form.price) < 0) {
        setFormError('Price cannot be negative.');
        setSaving(false);
        return;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert(payload);

        if (insertError) throw insertError;
      }

      setShowModal(false);
      await loadProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(product: Product) {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_available: !product.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update product';
      setError(msg);
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (deleteError) throw deleteError;

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      setError(msg);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'All platform products' : vendor?.business_name ?? 'Manage your products'}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No products yet.</p>
          {!isAdmin && (
            <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden flex flex-col">
              {/* Product image */}
              <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                )}
              </div>

              {/* Product info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
                  <span
                    className={`badge ${product.is_available ? 'badge-success' : 'badge-neutral'}`}
                  >
                    {product.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {product.category && (
                  <p className="text-xs text-slate-500 mt-1 capitalize">{product.category}</p>
                )}

                {product.description && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.discount_price && (
                    <span className="text-sm text-slate-400 line-through">
                      ${Number(product.discount_price).toFixed(2)}
                    </span>
                  )}
                  {product.unit && (
                    <span className="text-xs text-slate-500">/ {product.unit}</span>
                  )}
                </div>

                {/* Stock */}
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Stock:</span>
                  <span
                    className={`font-medium ${
                      product.stock_quantity > 0 ? 'text-slate-900' : 'text-red-600'
                    }`}
                  >
                    {product.stock_quantity}
                  </span>
                </div>

                {/* Actions */}
                {!isAdmin && (
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleAvailable(product)}
                      className="flex-1 text-sm text-slate-600 hover:text-slate-900 font-medium py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {product.is_available ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => !saving && setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={saveProduct} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input"
                    placeholder="piece, kg, liter..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Available for purchase
                </span>
              </label>

              {/* Modal footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    'Update Product'
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
