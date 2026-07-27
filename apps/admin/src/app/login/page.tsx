'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, Smartphone, ArrowRight } from 'lucide-react';
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
      router.replace('/');
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
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="doorli-hero-plane relative grid min-h-screen place-items-center overflow-hidden px-5 py-10">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />

      <div className="doorli-rise relative z-10 w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#185fa5] to-[#1d9e75] shadow-xl shadow-[#185fa5]/30">
            <ShieldCheck size={26} className="text-white" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Doorli Super Admin</h1>
          <p className="mt-1.5 text-sm text-doorli-muted">Platform operations control</p>
        </div>

        <div className="glass-card glass-card--lit p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
            <TabButton active={tab === 'password'} onClick={() => setTab('password')} icon={<KeyRound size={15} />}>
              Password
            </TabButton>
            <TabButton active={tab === 'otp'} onClick={() => setTab('otp')} icon={<Smartphone size={15} />}>
              Phone OTP
            </TabButton>
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-[rgba(242,102,139,0.35)] bg-[rgba(242,102,139,0.12)] px-3.5 py-2.5 text-sm text-[#ff9db4]">
              {error}
            </p>
          )}

          {tab === 'password' ? (
            <form onSubmit={loginPassword} className="space-y-3.5">
              <Field label="Email or username">
                <input
                  className="input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@doorli.me"
                  autoComplete="username"
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          ) : step === 'phone' ? (
            <div className="space-y-3.5">
              <Field label="Phone number">
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94770000000"
                  autoComplete="tel"
                />
              </Field>
              <button type="button" onClick={sendOtp} disabled={loading} className="btn btn-primary w-full py-3">
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {devOtp && (
                <p className="rounded-lg border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-3 py-2 text-xs text-doorli-gold">
                  Dev OTP: <span className="font-mono font-bold">{devOtp}</span>
                </p>
              )}
              <Field label="Verification code">
                <input
                  className="input tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  inputMode="numeric"
                />
              </Field>
              <button type="button" onClick={verifyOtp} disabled={loading} className="btn btn-primary w-full py-3">
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="btn btn-ghost w-full">
                Use a different number
              </button>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-doorli-dim">
          Restricted area. All access is logged and audited.
        </p>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${
        active
          ? 'bg-gradient-to-br from-[#185fa5] to-[#378add] text-white shadow-lg shadow-[#185fa5]/25'
          : 'text-doorli-muted hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">{label}</span>
      {children}
    </label>
  );
}
