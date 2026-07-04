'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface VendorShop {
  id: string;
  businessName: string;
  category: string;
  description: string | null;
  addressLine: string | null;
  city: string | null;
  deliveryRadiusKm: number;
  minOrderAmount: string | null;
}

export default function SettingsPage() {
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    addressLine: '',
    city: '',
    deliveryRadiusKm: '5',
    minOrderAmount: '',
  });
  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await apiFetch<VendorShop>('/api/v1/vendors/me/shop');
      setLoading(false);
      if (res.success && res.data) {
        const v = res.data;
        setVendorId(v.id);
        setForm({
          businessName: v.businessName,
          description: v.description ?? '',
          addressLine: v.addressLine ?? '',
          city: v.city ?? '',
          deliveryRadiusKm: String(v.deliveryRadiusKm),
          minOrderAmount: v.minOrderAmount ?? '',
        });
      }
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const res = await apiFetch(`/api/v1/vendors/${vendorId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: form.businessName,
        description: form.description || undefined,
        addressLine: form.addressLine,
        city: form.city,
        deliveryRadiusKm: parseInt(form.deliveryRadiusKm, 10),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
      }),
    });
    setSaving(false);
    setMessage(res.success ? 'Shop updated successfully' : (res.error ?? 'Update failed'));
  }

  if (loading) return <p className="text-slate-500">Loading settings...</p>;

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-2xl font-bold">Shop settings</h2>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      <form onSubmit={save} className="mt-6 space-y-4">
        {(['businessName', 'description', 'addressLine', 'city'] as const).map((field) => (
          <label key={field} className="block">
            <span className="text-sm font-medium capitalize text-slate-700">{field.replace(/([A-Z])/g, ' $1')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Delivery radius (km)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3"
            value={form.deliveryRadiusKm}
            onChange={(e) => setForm({ ...form, deliveryRadiusKm: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Minimum order (LKR)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-doorli-primary py-3 font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
