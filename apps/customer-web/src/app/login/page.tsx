"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPassword, registerCustomer, sendOtp, verifyOtp } from "@/lib/api";

const MARK = "/brand/doorli-mark.svg";

type Mode = "login" | "register" | "otp";

const tabActive = "bg-white !text-[#0a0f2e] font-semibold shadow-sm";
const tabIdle = "text-white/70 hover:text-white";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const [mode, setMode] = useState<Mode>("login");

  const [identifier, setIdentifier] = useState("customer@doorli.test");
  const [password, setPassword] = useState("Doorli123!");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [phone, setPhone] = useState("+94771234567");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<"phone" | "otp">("phone");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goAfterAuth() {
    // Hard navigation avoids Next soft-nav stalls after token write
    window.location.assign(next.startsWith("/") ? next : "/");
  }

  async function onPasswordLogin(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithPassword(identifier.trim(), password);
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  async function onRegister(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim() || undefined,
        password: regPassword,
      });
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
  }

  async function onSendOtp(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await sendOtp(phone);
      if (data.code) setDevOtp(data.code);
      setOtpStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, code);
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} alt="Doorli" className="w-20 h-20 rounded-2xl shadow-xl shadow-black/40" />
          <span className="font-display text-3xl font-bold text-white tracking-tight">Doorli</span>
        </Link>
        <p className="text-[var(--doorli-text-muted)] mt-2 text-sm">Customer access — email / username + password</p>
      </div>

      <div className="doorli-glass rounded-2xl p-8 space-y-4">
        <div className="flex gap-1 p-1 rounded-xl bg-black/25 border border-white/10">
          {(
            [
              ["login", "Sign in"],
              ["register", "Create"],
              ["otp", "Phone OTP"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={`flex-1 text-xs sm:text-sm py-2 rounded-lg transition-colors ${
                mode === id ? tabActive : tabIdle
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-amber-200 bg-amber-500/15 border border-amber-400/25 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {mode === "login" && (
          <form className="space-y-4" method="post" action="#" onSubmit={onPasswordLogin}>
            <label className="block text-sm text-white/80">
              Email or username
              <input
                className={`mt-1.5 ${inputClass}`}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="block text-sm text-white/80">
              Password
              <input
                type="password"
                className={`mt-1.5 ${inputClass}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <p className="text-xs text-white/45">Demo: customer@doorli.test / Doorli123!</p>
            <button
              type="submit"
              disabled={loading}
              className="w-full doorli-cta-primary justify-center disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {mode === "register" && (
          <form className="space-y-3" method="post" action="#" onSubmit={onRegister}>
            <input
              className={inputClass}
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full doorli-cta-primary justify-center disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create customer account"}
            </button>
          </form>
        )}

        {mode === "otp" &&
          (otpStep === "phone" ? (
            <form className="space-y-3" method="post" action="#" onSubmit={onSendOtp}>
              <p className="text-sm text-white/50">Phone OTP (legacy)</p>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <button
                type="submit"
                disabled={loading}
                className="w-full doorli-cta-primary justify-center disabled:opacity-50"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form className="space-y-3" method="post" action="#" onSubmit={onVerifyOtp}>
              {devOtp && (
                <p className="text-[var(--doorli-mint)] text-sm">
                  Dev OTP: <strong>{devOtp}</strong>
                </p>
              )}
              <input
                className={`${inputClass} tracking-widest`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full doorli-cta-primary justify-center disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          ))}

        {/* ── Google OAuth ─────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <span className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">or</span>
          <span className="flex-1 h-px bg-white/10" />
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:4001"}/auth/google`}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white text-[#1a1a1a] text-sm font-semibold hover:bg-white/90 transition"
        >
          {/* Google "G" SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.2 30.2 0 24 0 14.8 0 7 5.4 3.2 13.3l7.8 6C12.9 13.7 18 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.8-2.2 5.2-4.7 6.8l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.5z"/>
            <path fill="#FBBC05" d="M11 28.3A14.5 14.5 0 0 1 9.5 24c0-1.5.3-2.9.7-4.3L2.4 13.6A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.5-6.3z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6 0-11.1-4.1-12.9-9.7l-8.5 6.3C7 43 15 48 24 48z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-center text-xs text-white/45 pt-2 border-t border-white/10">
          Selling on Doorli?{" "}
          <a href="/vendor/login" className="text-[var(--doorli-mint)] underline underline-offset-2">
            Vendor portal login
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <main className="min-h-screen doorli-hero-plane relative flex items-center justify-center p-6 overflow-hidden">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<p className="text-white/50">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
