'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('admin@doorli.test');
  const [password, setPassword] = useState('Doorli123!');
  const [phone, setPhone] = useState('+94770000000');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loginPassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, expectedRole: 'admin' }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Login failed');
      localStorage.setItem('doorli_admin_token', json.data.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to send OTP');
      if (json.data?.code) setDevOtp(json.data.code);
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Invalid OTP');
      if (json.data?.user?.role !== 'admin') throw new Error('Admin access required');
      localStorage.setItem('doorli_admin_token', json.data.accessToken);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Doorli Admin</h1>
          <p className="text-slate-400 mt-1">Operations control</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium min-h-11 ${tab === 'password' ? 'bg-blue-600' : ''}`}
            onClick={() => setTab('password')}
          >
            Password
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium min-h-11 ${tab === 'otp' ? 'bg-blue-600' : ''}`}
            onClick={() => setTab('otp')}
          >
            Phone OTP
          </button>
        </div>
        {error && <p className="text-amber-300 text-sm">{error}</p>}
        {tab === 'password' ? (
          <form onSubmit={loginPassword} className="space-y-3">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-11"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or username"
            />
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 rounded-xl py-3 font-semibold min-h-12 disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : step === 'phone' ? (
          <div className="space-y-3">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-11"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button type="button" onClick={sendOtp} disabled={loading} className="w-full bg-blue-600 rounded-xl py-3 font-semibold min-h-12">
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {devOtp && <p className="text-xs text-slate-400">Dev OTP: {devOtp}</p>}
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-11"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="OTP"
            />
            <button type="button" onClick={verifyOtp} disabled={loading} className="w-full bg-blue-600 rounded-xl py-3 font-semibold min-h-12">
              Verify
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
