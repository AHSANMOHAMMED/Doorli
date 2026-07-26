
"use client";

import React, { useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function CreateAdminEntityPage() {
  const [tab, setTab] = useState<'vendor' | 'user'>('vendor');
  
  // Vendor state
  const [vendorName, setVendorName] = useState('');
  const [vendorDba, setVendorDba] = useState('');
  const [erpTenantId, setErpTenantId] = useState('');
  const [vendorAdminName, setVendorAdminName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  // User state
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'vendor') {
        const res = await superAdminFetch('/admin/vendors', {
          method: 'POST',
          body: JSON.stringify({
            businessName: vendorName || vendorDba || 'New Vendor',
            email: vendorEmail,
            phone: vendorPhone,
            erpTenantId
          })
        });
        if (res.success) alert('Vendor created successfully!');
      } else {
        const res = await superAdminFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            fullName: userName,
            email: userEmail,
            phone: userPhone,
            role: userRole
          })
        });
        if (res.success) alert('System User created successfully!');
      }
    } catch (err) {
      alert('Error creating entity');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      {/* Top Navigation */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-background z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors">menu</button>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Super Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary">terminal</span>
            <span className="text-caption font-caption text-on-surface-variant">NODE_04_STABLE</span>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">notifications</button>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-xs">SA</div>
        </div>
      </header>

      <main className="min-h-screen max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-32">
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-screen-title text-screen-title text-on-surface">Entity Provisioning</h2>
            <p className="text-on-surface-variant font-body-compact text-body-compact mt-1">Configure and deploy new system stakeholders into the Doorli ecosystem.</p>
          </div>
          <div className="flex gap-3">
            <button 
                className={`px-lg py-2 rounded-xl font-label-medium text-label-medium transition-all ${tab === 'vendor' ? 'bg-primary-container text-on-primary-container shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border border-outline/10'}`} 
                onClick={() => setTab('vendor')}
                type="button"
            >
                Vendor Registration
            </button>
            <button 
                className={`px-lg py-2 rounded-xl font-label-medium text-label-medium transition-all ${tab === 'user' ? 'bg-primary-container text-on-primary-container shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border border-outline/10'}`} 
                onClick={() => setTab('user')}
                type="button"
            >
                System User
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <aside className="lg:col-span-3 space-y-gutter">
            <div className="bg-surface-container rounded-xl p-md border border-outline/10">
              <h3 className="font-section-header text-section-header mb-sm">Provisioning Guide</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-md">check_circle</span>
                  <div className="text-caption font-caption">
                    <p className="text-on-surface font-semibold">Identity Verification</p>
                    <p className="text-on-surface-variant">ERP data will be validated against master records.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-md">pending</span>
                  <div className="text-caption font-caption">
                    <p className="text-on-surface font-semibold">Security Clearance</p>
                    <p className="text-on-surface-variant">Default access policies apply post-creation.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative h-48 rounded-xl overflow-hidden group">
              <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="A high-tech digital control room dashboard with glowing red and blue data visualizations, holographic maps, and floating glass interfaces against a dark, futuristic architectural background." ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-primary-container/20 text-primary px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Live Infrastructure</span>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <form className="space-y-gutter" id="provisioning-form" onSubmit={handleSubmit}>
              
              {tab === 'vendor' && (
                <div className="bg-surface-container border border-outline/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300" id="vendor-section">
                  <div className="p-md bg-surface-container-high border-b border-outline/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">store</span>
                      <h3 className="font-section-header text-section-header">Commercial Entity Profile</h3>
                    </div>
                    <span className="text-caption font-caption bg-surface-container-highest px-2 py-1 rounded border border-outline/20 text-on-surface-variant">STEP 1 OF 3</span>
                  </div>
                  <div className="p-lg space-y-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                      <div className="space-y-base">
                        <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Business Legal Name</label>
                        <input required value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all" placeholder="e.g. Doorli Logistics Ltd." type="text"/>
                      </div>
                      <div className="space-y-base">
                        <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Trading Identifier (DBA)</label>
                        <input value={vendorDba} onChange={(e) => setVendorDba(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all" placeholder="Optional" type="text"/>
                      </div>
                    </div>
                    <div className="p-md bg-background/50 rounded-xl border border-outline/5 space-y-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-secondary text-sm">settings_ethernet</span>
                        <h4 className="font-label-medium text-label-medium text-secondary uppercase tracking-wider">Infrastructure Integration</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        <div className="space-y-base">
                          <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">ERP Tenant ID</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">database</span>
                            <input value={erpTenantId} onChange={(e) => setErpTenantId(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl pl-10 pr-md py-sm text-on-surface placeholder:text-on-surface-variant/40 font-mono" placeholder="TX-990-AD" type="text"/>
                          </div>
                        </div>
                        <div className="space-y-base">
                          <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Region Hub</label>
                          <select className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-[11px] text-on-surface transition-all appearance-none">
                            <option>North America (East)</option>
                            <option>EMEA Central</option>
                            <option>APAC Southeast</option>
                          </select>
                        </div>
                        <div className="space-y-base">
                          <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">API Lifecycle</label>
                          <select className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-[11px] text-on-surface transition-all appearance-none">
                            <option>Production (Stable)</option>
                            <option>Sandbox (Test)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-surface-container border border-outline/10 rounded-xl overflow-hidden shadow-lg">
                <div className="p-md bg-surface-container-high border-b border-outline/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">contact_mail</span>
                    <h3 className="font-section-header text-section-header">
                      {tab === 'vendor' ? 'Primary Point of Contact' : 'User Information'}
                    </h3>
                  </div>
                </div>
                <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="space-y-base">
                    <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">{tab === 'vendor' ? 'Administrator Name' : 'Full Name'}</label>
                    <input required value={tab === 'vendor' ? vendorAdminName : userName} onChange={(e) => tab === 'vendor' ? setVendorAdminName(e.target.value) : setUserName(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40" placeholder="Full name" type="text"/>
                  </div>
                  <div className="space-y-base">
                    <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Direct Email</label>
                    <input required value={tab === 'vendor' ? vendorEmail : userEmail} onChange={(e) => tab === 'vendor' ? setVendorEmail(e.target.value) : setUserEmail(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40" placeholder="admin@domain.com" type="email"/>
                  </div>
                  <div className="space-y-base">
                    <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Operational Phone</label>
                    <input value={tab === 'vendor' ? vendorPhone : userPhone} onChange={(e) => tab === 'vendor' ? setVendorPhone(e.target.value) : setUserPhone(e.target.value)} className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40" placeholder="+1 (555) 000-0000" type="tel"/>
                  </div>
                  <div className="space-y-base">
                    <label className="font-label-medium text-label-medium text-on-surface-variant ml-1">Emergency Pager/Ext</label>
                    <input className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-md py-sm text-on-surface placeholder:text-on-surface-variant/40" placeholder="Optional" type="text"/>
                  </div>
                </div>
              </div>

              {tab === 'user' && (
                <div className="bg-surface-container border border-outline/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300" id="role-section">
                  <div className="p-md bg-surface-container-high border-b border-outline/10 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <h3 className="font-section-header text-section-header">Privilege &amp; Role Configuration</h3>
                  </div>
                  <div className="p-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                      <label className="relative cursor-pointer group">
                        <input checked={userRole === 'admin'} onChange={(e) => setUserRole(e.target.value)} className="peer sr-only" name="system_role" type="radio" value="admin"/>
                        <div className="p-md rounded-xl border border-outline/20 bg-surface-container-lowest transition-all peer-checked:border-primary peer-checked:bg-primary-container/5 hover:border-primary/50">
                          <div className="flex justify-between items-start mb-sm">
                            <span className="material-symbols-outlined text-primary">shield_person</span>
                            <div className="w-4 h-4 rounded-full border-2 border-outline/40 peer-checked:border-primary flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100"></div>
                            </div>
                          </div>
                          <p className="font-label-medium text-label-medium text-on-surface">System Admin</p>
                          <p className="text-caption font-caption text-on-surface-variant mt-1">Full override &amp; infrastructure management.</p>
                        </div>
                      </label>

                      <label className="relative cursor-pointer group">
                        <input checked={userRole === 'analyst'} onChange={(e) => setUserRole(e.target.value)} className="peer sr-only" name="system_role" type="radio" value="analyst"/>
                        <div className="p-md rounded-xl border border-outline/20 bg-surface-container-lowest transition-all peer-checked:border-primary peer-checked:bg-primary-container/5 hover:border-primary/50">
                          <div className="flex justify-between items-start mb-sm">
                            <span className="material-symbols-outlined text-secondary">analytics</span>
                            <div className="w-4 h-4 rounded-full border-2 border-outline/40 peer-checked:border-primary flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100"></div>
                            </div>
                          </div>
                          <p className="font-label-medium text-label-medium text-on-surface">Data Analyst</p>
                          <p className="text-caption font-caption text-on-surface-variant mt-1">Read-access to metrics &amp; global logs.</p>
                        </div>
                      </label>

                      <label className="relative cursor-pointer group">
                        <input checked={userRole === 'support'} onChange={(e) => setUserRole(e.target.value)} className="peer sr-only" name="system_role" type="radio" value="support"/>
                        <div className="p-md rounded-xl border border-outline/20 bg-surface-container-lowest transition-all peer-checked:border-primary peer-checked:bg-primary-container/5 hover:border-primary/50">
                          <div className="flex justify-between items-start mb-sm">
                            <span className="material-symbols-outlined text-tertiary">support_agent</span>
                            <div className="w-4 h-4 rounded-full border-2 border-outline/40 peer-checked:border-primary flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100"></div>
                            </div>
                          </div>
                          <p className="font-label-medium text-label-medium text-on-surface">Support Tech</p>
                          <p className="text-caption font-caption text-on-surface-variant mt-1">Manage user tickets &amp; basic account triage.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-gutter pt-lg border-t border-outline/10">
                <div className="flex items-center gap-3">
                  <input required className="w-4 h-4 rounded border-outline/30 bg-surface-container-lowest text-primary-container focus:ring-primary ring-offset-background" id="confirm-policy" type="checkbox"/>
                  <label className="text-caption font-caption text-on-surface-variant" htmlFor="confirm-policy">I certify that all technical and legal documentation has been verified.</label>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-xl py-3 border border-outline/30 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors font-label-medium" type="button">
                    Save Draft
                  </button>
                  <button disabled={loading} className="flex-1 md:flex-none px-xl py-3 bg-primary-container text-on-primary-container rounded-xl font-label-medium shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50" type="submit">
                    {loading ? 'Deploying...' : 'Deploy Entity'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface-container border-t border-surface-variant shadow-md flex justify-around items-center h-16 px-2 pb-safe">
        <div className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-medium text-label-medium">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150">
          <span className="material-symbols-outlined">store</span>
          <span className="font-label-medium text-label-medium">Vendors</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150">
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-medium text-label-medium">Users</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-label-medium text-label-medium">Orders</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-secondary-container px-3 py-1 active:scale-95 transition-transform duration-150">
          <span className="material-symbols-outlined">more_horiz</span>
          <span className="font-label-medium text-label-medium">More</span>
        </div>
      </nav>
    </div>
  );
}
