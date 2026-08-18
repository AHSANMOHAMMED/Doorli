"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarCheck, FlaskConical, HeartPulse } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Provider = { id: string; name: string; type: string; specialty: string; city: string; fee: number };

const TYPES = [
  ["doctor", Activity, "Doctors"],
  ["lab", FlaskConical, "Labs"],
  ["gym", HeartPulse, "Fitness"],
  ["nurse", CalendarCheck, "Nursing"],
] as const;

export default function HealthPage() {
  const [type, setType] = useState("doctor");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProviders() {
    setLoading(true);
    setError(null);
    try {
      const items = await apiFetch<Provider[]>(`/health/providers/search?type=${type}`);
      setProviders(items);
      setProviderId(items[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Health providers unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProviders(); }, [type]);

  async function book(event: FormEvent) {
    event.preventDefault();
    if (!getCustomerToken()) { window.location.assign("/login?next=/health"); return; }
    if (!providerId) { setError("Choose an available provider first."); return; }
    if (!slot) { setError("Choose a date and time first."); return; }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ provider: string; slotTime: string }>("/health/appointments", {
        method: "POST",
        body: JSON.stringify({ providerId, slotTime: new Date(slot).toISOString(), notes, type }),
      });
      setMessage(`${data.provider} appointment confirmed for ${new Date(data.slotTime).toLocaleString()}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to book appointment.");
    } finally {
      setSaving(false);
    }
  }

  const input = "mt-2 w-full rounded-xl border border-white/15 bg-[#101c35] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]";

  return (
    <main className="doorli-page-shell text-white">
      <div className="mx-auto max-w-3xl space-y-7 px-5 py-10 pb-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Doorli</Link>
        <header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Health and wellness</p><h1 className="mt-2 font-display text-4xl font-bold">Care close to home</h1><p className="mt-2 text-white/60">Find a provider, book a time, or arrange a home lab collection.</p></header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TYPES.map(([value, Icon, label]) => <button type="button" key={value} onClick={() => setType(value)} className={`doorli-glass-card rounded-2xl p-4 text-left ${type === value ? "border-[var(--doorli-mint)]" : ""}`}><Icon className="h-5 w-5 text-[var(--doorli-mint)]" /><p className="mt-3 text-sm font-semibold">{label}</p></button>)}
        </div>
        <form onSubmit={book} className="doorli-glass rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold capitalize">Book a {type} service</h2>
          {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"><span>{error}</span><button type="button" onClick={() => void loadProviders()} className="underline">Retry</button></div>}
          {message && <p className="mt-4 rounded-xl border border-[var(--doorli-mint)]/30 bg-[var(--doorli-mint)]/10 px-4 py-3 text-sm text-[var(--doorli-mint)]">{message}</p>}
          <label className="mt-5 block text-sm text-white/70">Provider<select value={providerId} onChange={(e) => setProviderId(e.target.value)} disabled={loading || providers.length === 0} className={input} required><option value="">{loading ? "Loading providers…" : providers.length ? "Select a provider" : "No providers available"}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.specialty} · LKR {provider.fee}</option>)}</select></label>
          <label className="mt-4 block text-sm text-white/70">Date and time<input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} className={input} required /></label>
          <label className="mt-4 block text-sm text-white/70">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={input} rows={3} placeholder="Symptoms, collection notes, or accessibility needs" /></label>
          <button type="submit" disabled={saving || loading || !providerId} className="doorli-cta-primary mt-5 w-full justify-center disabled:opacity-50">{saving ? "Confirming appointment…" : "Confirm appointment"}</button>
        </form>
      </div>
    </main>
  );
}
