'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    category: 'grocery',
    description: '',
    addressLine: '',
    city: 'Colombo',
    latitude: '6.9271',
    longitude: '79.8612',
    deliveryRadiusKm: '5',
    minOrderAmount: '500',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await apiFetch('/api/v1/vendors', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        deliveryRadiusKm: parseInt(form.deliveryRadiusKm, 10),
        minOrderAmount: parseFloat(form.minOrderAmount),
      }),
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error ?? 'Failed to register shop');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-2xl font-bold">Register your shop</h2>
      <p className="mt-1 text-slate-500">Set up your business on Doorli</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Business name">
          <input
            required
            className="input"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="grocery">Grocery</option>
            <option value="restaurant">Restaurant</option>
            <option value="beauty">Beauty</option>
          </select>
        </Field>
        <Field label="Description">
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <input
            required
            className="input"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              required
              className="input"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              className="input"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-doorli-primary py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register shop'}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
