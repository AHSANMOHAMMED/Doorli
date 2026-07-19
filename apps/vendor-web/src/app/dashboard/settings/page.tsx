'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Loader as Loader2, Store, User, Check, CircleAlert as AlertCircle } from 'lucide-react';

interface VendorForm {
  businessName: string;
  description: string;
  phone: string;
  addressLine: string;
  city: string;
  isOpen: boolean;
  deliveryRadiusKm: string;
  minOrderAmount: string;
}

interface ProfileForm {
  fullName: string;
  email: string;
}

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorForm>({
    businessName: '',
    description: '',
    phone: '',
    addressLine: '',
    city: '',
    isOpen: true,
    deliveryRadiusKm: '5',
    minOrderAmount: '',
  });
  const [profileForm, setProfileForm] = useState<ProfileForm>({ fullName: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [savingVendor, setSavingVendor] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [vendorMessage, setVendorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (authLoading || !profile) return;
    void loadData();
  }, [authLoading, profile]);

  async function loadData() {
    setLoading(true);
    try {
      setProfileForm({
        fullName: profile?.full_name ?? user?.fullName ?? '',
        email: '',
      });
      const me = await apiFetch<{ fullName?: string; email?: string | null }>('/users/me');
      if (me.success && me.data) {
        setProfileForm({
          fullName: me.data.fullName ?? '',
          email: me.data.email ?? '',
        });
      }

      const vendorRes = await apiFetch<{
        id: string;
        businessName: string;
        description?: string | null;
        phone?: string | null;
        addressLine?: string | null;
        city?: string | null;
        isOpen: boolean;
        deliveryRadiusKm?: number;
        minOrderAmount?: number | string | null;
      }>('/vendors/me');

      if (vendorRes.success && vendorRes.data) {
        const v = vendorRes.data;
        setVendorId(v.id);
        setVendorForm({
          businessName: v.businessName ?? '',
          description: v.description ?? '',
          phone: v.phone ?? '',
          addressLine: v.addressLine ?? '',
          city: v.city ?? '',
          isOpen: v.isOpen,
          deliveryRadiusKm: String(v.deliveryRadiusKm ?? 5),
          minOrderAmount: v.minOrderAmount != null ? String(v.minOrderAmount) : '',
        });
      }
    } catch (err) {
      setVendorMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load settings',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) return;
    setSavingVendor(true);
    setVendorMessage(null);
    try {
      const res = await apiFetch(`/vendors/${vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          businessName: vendorForm.businessName,
          description: vendorForm.description || undefined,
          phone: vendorForm.phone || undefined,
          addressLine: vendorForm.addressLine,
          city: vendorForm.city || undefined,
          isOpen: vendorForm.isOpen,
          deliveryRadiusKm: parseInt(vendorForm.deliveryRadiusKm, 10) || 5,
          minOrderAmount: vendorForm.minOrderAmount
            ? parseFloat(vendorForm.minOrderAmount)
            : undefined,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Save failed');
      setVendorMessage({ type: 'success', text: 'Shop settings saved' });
    } catch (err) {
      setVendorMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingVendor(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email || undefined,
        }),
      });
      if (!res.success) throw new Error(res.error || 'Save failed');
      setProfileMessage({ type: 'success', text: 'Profile saved' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and shop details</p>
      </div>

      <form onSubmit={saveProfile} className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5" /> Profile
        </h2>
        {profileMessage && (
          <p
            className={`text-sm flex items-center gap-2 ${
              profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {profileMessage.text}
          </p>
        )}
        <label className="block text-sm">
          Full name
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={profileForm.fullName}
            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={savingProfile}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {savingProfile ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      {vendorId ? (
        <form onSubmit={saveVendor} className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Store className="w-5 h-5" /> Shop
          </h2>
          {vendorMessage && (
            <p
              className={`text-sm flex items-center gap-2 ${
                vendorMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {vendorMessage.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {vendorMessage.text}
            </p>
          )}
          <label className="block text-sm">
            Business name
            <input
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={vendorForm.businessName}
              onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              className="mt-1 w-full border rounded-lg px-3 py-2"
              rows={3}
              value={vendorForm.description}
              onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Address
            <input
              required
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={vendorForm.addressLine}
              onChange={(e) => setVendorForm({ ...vendorForm, addressLine: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              City
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={vendorForm.city}
                onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Phone
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              Delivery radius (km)
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={vendorForm.deliveryRadiusKm}
                onChange={(e) => setVendorForm({ ...vendorForm, deliveryRadiusKm: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Min order amount
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={vendorForm.minOrderAmount}
                onChange={(e) => setVendorForm({ ...vendorForm, minOrderAmount: e.target.value })}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={vendorForm.isOpen}
              onChange={(e) => setVendorForm({ ...vendorForm, isOpen: e.target.checked })}
            />
            Shop is open for orders
          </label>
          <button
            type="submit"
            disabled={savingVendor}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {savingVendor ? 'Saving...' : 'Save shop settings'}
          </button>
        </form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
          No shop profile yet.{' '}
          <a href="/dashboard/onboarding" className="underline font-medium">
            Complete onboarding
          </a>
        </div>
      )}
    </div>
  );
}
