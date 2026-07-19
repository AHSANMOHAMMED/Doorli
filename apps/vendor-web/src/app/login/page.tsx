'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const MARK = '/vendor/brand/doorli-mark.svg';

type Mode = 'login' | 'register' | 'otp';

export default function LoginPage() {
  const { requestOtp, signInWithOtp, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  const [businessKey, setBusinessKey] = useState('Corner Grocery');
  const [identifier, setIdentifier] = useState('vendor@doorli.test');
  const [password, setPassword] = useState('Doorli123!');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('grocery');

  const [phone, setPhone] = useState('+94771234568');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPasswordLogin(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(identifier.trim(), password, businessKey.trim());
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    window.location.assign('/vendor/dashboard/kitchen');
  }

  async function onRegister(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      username: username.trim() || undefined,
      password: regPassword,
      businessName: businessName.trim(),
      category,
    });
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    window.location.assign('/vendor/dashboard/onboarding');
  }

  async function send() {
    setLoading(true);
    setError(null);
    const { error, code: otp } = await requestOtp(phone);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (otp) setDevOtp(otp);
    setOtpStep('otp');
  }

  async function verify() {
    setLoading(true);
    setError(null);
    const { error } = await signInWithOtp(phone, code);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    window.location.assign('/vendor/dashboard/kitchen');
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]';

  return (
    <div className="doorli-public min-h-screen doorli-hero-plane relative flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK} alt="Doorli" className="w-20 h-20 rounded-2xl shadow-xl shadow-black/40" />
            <span className="font-display text-3xl font-bold text-white tracking-tight">Doorli</span>
          </Link>
          <p className="text-[var(--doorli-text-muted)] mt-2 text-sm">Vendor portal — role-based access</p>
        </div>

        <div className="doorli-glass rounded-2xl p-8 space-y-4">
          <div className="flex gap-1 p-1 rounded-xl bg-black/25 border border-white/10">
            {(
              [
                ['login', 'Sign in'],
                ['register', 'Create'],
                ['otp', 'Phone OTP'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError(null);
                }}
                className={`flex-1 text-xs sm:text-sm py-2 rounded-lg font-medium transition-colors ${
                  mode === id ? 'bg-white !text-[#0a0f2e] shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-200 bg-red-500/15 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {mode === 'login' && (
            <form className="space-y-4" method="post" action="#" onSubmit={onPasswordLogin}>
              <label className="block text-sm font-medium text-white/85">
                Business name or vendor ID
                <input className={inputClass} value={businessKey} onChange={(e) => setBusinessKey(e.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-white/85">
                Email or username
                <input
                  className={inputClass}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-white/85">
                Password
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <p className="text-xs text-white/45">
                Demo: Corner Grocery · vendor@doorli.test · Doorli123!
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full doorli-cta-primary justify-center disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in as vendor'}
              </button>
              <p className="text-center text-xs text-white/45">
                Shopping instead?{' '}
                <a href="/login" className="text-[var(--doorli-mint)] underline underline-offset-2">
                  Customer login
                </a>
              </p>
            </form>
          )}

          {mode === 'register' && (
            <>
              <input
                className={inputClass}
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <select
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="grocery">Grocery</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="hall">Hall</option>
                <option value="service">Service</option>
                <option value="beauty">Beauty</option>
              </select>
              <input
                className={inputClass}
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Username (optional)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Password (min 6)"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <button
                type="button"
                disabled={loading}
                onClick={onRegister}
                className="w-full doorli-cta-primary justify-center disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create vendor account'}
              </button>
            </>
          )}

          {mode === 'otp' &&
            (otpStep === 'phone' ? (
              <>
                <label className="block text-sm font-medium text-white/85">
                  Phone
                  <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <p className="text-xs text-white/45">Seed: +94771234568 · restaurant: +94771234570</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={send}
                  className="w-full doorli-cta-primary justify-center disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                {devOtp && (
                  <p className="text-sm text-[var(--doorli-mint)] bg-emerald-500/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                    Dev OTP: <strong>{devOtp}</strong>
                  </p>
                )}
                <label className="block text-sm font-medium text-white/85">
                  OTP
                  <input
                    className={`${inputClass} tracking-widest`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={loading}
                  onClick={verify}
                  className="w-full doorli-cta-primary justify-center disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Sign in'}
                </button>
              </>
            ))}
        </div>
      </div>
    </div>
  );
}
