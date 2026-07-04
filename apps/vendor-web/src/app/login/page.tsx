'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setLoading(true);
    setError('');
    const res = await apiFetch<{ message: string }>('/api/v1/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? 'Failed to send OTP');
      return;
    }
    setStep('otp');
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    const res = await apiFetch<{
      accessToken: string;
      refreshToken: string;
      user: { role: string };
    }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        code,
        fullName: fullName || undefined,
        role: 'vendor',
      }),
    });
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Verification failed');
      return;
    }
    setToken(res.data.accessToken);
    localStorage.setItem('doorli_refresh', res.data.refreshToken);
    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-doorli-primary">Vendor Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage your shop</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {step === 'phone' ? (
          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
              placeholder="+94771234568"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              className="w-full rounded-lg bg-doorli-primary py-3 font-medium text-white disabled:opacity-50"
              disabled={loading || !phone}
              onClick={sendOtp}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
              placeholder="Your name (new vendors)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
              placeholder="6-digit OTP"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="w-full rounded-lg bg-doorli-primary py-3 font-medium text-white disabled:opacity-50"
              disabled={loading || code.length !== 6}
              onClick={verifyOtp}
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
