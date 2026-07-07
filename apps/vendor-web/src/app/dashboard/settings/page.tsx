'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Vendor } from '@/lib/types';
import { Loader as Loader2, Store, User, Check, CircleAlert as AlertCircle } from 'lucide-react';

interface VendorForm {
  business_name: string;
  description: string;
  phone: string;
  address_line: string;
  city: string;
  is_open: boolean;
  delivery_radius_km: string;
  min_order_amount: string;
}

interface ProfileForm {
  full_name: string;
  phone: string;
  avatar_url: string;
}

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorForm>({
    business_name: '',
    description: '',
    phone: '',
    address_line: '',
    city: '',
    is_open: false,
    delivery_radius_km: '5',
    min_order_amount: '',
  });
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    avatar_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingVendor, setSavingVendor] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [vendorMessage, setVendorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadData() {
    setLoading(true);
    try {
      // Load profile form from auth context profile
      if (profile) {
        setProfileForm({
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          avatar_url: profile.avatar_url ?? '',
        });
      }

      // Load vendor record
      if (!isAdmin) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', profile!.id)
          .maybeSingle();

        if (vendorError) throw vendorError;

        if (vendorData) {
          const v = vendorData as Vendor;
          setVendor(v);
          setVendorForm({
            business_name: v.business_name ?? '',
            description: v.description ?? '',
            phone: v.phone ?? '',
            address_line: v.address_line ?? '',
            city: v.city ?? '',
            is_open: v.is_open,
            delivery_radius_km: String(v.delivery_radius_km ?? 5),
            min_order_amount: v.min_order_amount ? String(v.min_order_amount) : '',
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load settings';
      setVendorMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault();
    setSavingVendor(true);
    setVendorMessage(null);

    try {
      if (!vendor) {
        setVendorMessage({ type: 'error', text: 'No vendor profile found.' });
        setSavingVendor(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          business_name: vendorForm.business_name,
          description: vendorForm.description || null,
          phone: vendorForm.phone || null,
          address_line: vendorForm.address_line || null,
          city: vendorForm.city || null,
          is_open: vendorForm.is_open,
          delivery_radius_km: parseInt(vendorForm.delivery_radius_km, 10) || 5,
          min_order_amount: vendorForm.min_order_amount
            ? parseFloat(vendorForm.min_order_amount)
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setVendorMessage({ type: 'success', text: 'Business settings saved successfully.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save business settings';
      setVendorMessage({ type: 'error', text: msg });
    } finally {
      setSavingVendor(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      if (!profile) {
        setProfileMessage({ type: 'error', text: 'No profile found.' });
        setSavingProfile(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
          avatar_url: profileForm.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfileMessage({ type: 'success', text: 'Profile settings saved successfully.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile settings';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setSavingProfile(false);
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
    <div className="animate-fade-in space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your business and profile settings</p>
      </div>

      {/* Vendor / Business settings */}
      {!isAdmin && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Business Settings</h2>
              <p className="text-sm text-slate-500">Update your vendor profile and shop details</p>
            </div>
          </div>

          {vendorMessage && (
            <div
              className={`mb-4 p-3 rounded-lg border text-sm flex items-start gap-2 ${
                vendorMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {vendorMessage.type === 'success' ? (
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              {vendorMessage.text}
            </div>
          )}

          {!vendor ? (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-lg border border-amber-200 text-sm">
              No vendor profile found. Please complete onboarding first to set up your business.
            </div>
          ) : (
            <form onSubmit={saveVendor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.business_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, business_name: e.target.value })}
                  className="input"
                  placeholder="Business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={vendorForm.description}
                  onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Describe your business"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="input"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={vendorForm.city}
                    onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                    className="input"
                    placeholder="City"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={vendorForm.address_line}
                  onChange={(e) => setVendorForm({ ...vendorForm, address_line: e.target.value })}
                  className="input"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vendorForm.delivery_radius_km}
                    onChange={(e) => setVendorForm({ ...vendorForm, delivery_radius_km: e.target.value })}
                    className="input"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum Order Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vendorForm.min_order_amount}
                    onChange={(e) => setVendorForm({ ...vendorForm, min_order_amount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorForm.is_open}
                  onChange={(e) => setVendorForm({ ...vendorForm, is_open: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Shop is currently open
                  </span>
                  <p className="text-xs text-slate-500">
                    Customers can only place orders when your shop is open
                  </p>
                </div>
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingVendor}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {savingVendor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Business Settings'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Profile settings */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Profile Settings</h2>
            <p className="text-sm text-slate-500">Update your personal account information</p>
          </div>
        </div>

        {profileMessage && (
          <div
            className={`mb-4 p-3 rounded-lg border text-sm flex items-start gap-2 ${
              profileMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="input"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="input"
              placeholder="+1 234 567 890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Avatar URL
            </label>
            <input
              type="url"
              value={profileForm.avatar_url}
              onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
          </div>

          {profileForm.avatar_url && (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileForm.avatar_url}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-sm text-slate-500">Avatar preview</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary inline-flex items-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
