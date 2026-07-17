'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem('doorli_admin_token', token);
    setSaved(true);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-3xl font-bold text-slate-900">Platform Settings</h1>
      <p className="text-slate-500">Paste an admin JWT from `/api/v1/auth/verify-otp` (role=admin) to load live data.</p>
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Admin access token</label>
        <textarea
          className="w-full border rounded-xl p-3 text-sm min-h-[120px]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOi..."
        />
        <button onClick={save} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold">
          Save token
        </button>
        {saved && <p className="text-emerald-600 text-sm">Saved to localStorage.</p>}
      </div>
    </div>
  );
}
