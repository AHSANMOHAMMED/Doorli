"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CalendarCheck, FlaskConical, HeartPulse } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Provider = { id: string; name: string; type: string; specialty: string; city: string; fee: number };

export default function HealthPage() {
  const [type, setType] = useState("doctor");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Provider[]>(`/health/providers/search?type=${type}`).then((items) => { setProviders(items); setProviderId(items[0]?.id ?? ""); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Health providers unavailable."));
  }, [type]);

  async function book(event: FormEvent) {
    event.preventDefault();
    if (!getCustomerToken()) { window.location.assign("/login?next=/health"); return; }
    setError(null);
    try {
      const data = await apiFetch<{ provider: string; slotTime: string }>("/health/appointments", { method: "POST", body: JSON.stringify({ providerId, slotTime: new Date(slot).toISOString(), notes, type }) });
      setMessage(`${data.provider} appointment confirmed for ${new Date(data.slotTime).toLocaleString()}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to book appointment."); }
  }

  return <main className="doorli-page-shell text-white"><div className="max-w-3xl mx-auto px-5 py-10 pb-28 space-y-7"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Doorli</Link><header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Health and wellness</p><h1 className="font-display text-4xl font-bold mt-2">Care close to home</h1><p className="text-white/60 mt-2">Find a provider, book a time, or arrange a home lab collection.</p></header><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["doctor", Activity, "Doctors"], ["lab", FlaskConical, "Labs"], ["gym", HeartPulse, "Fitness"], ["nurse", CalendarCheck, "Nursing"]].map(([value, Icon, label]) => <button type="button" key={String(value)} onClick={() => setType(String(value))} className={`doorli-glass-card rounded-2xl p-4 text-left ${type === value ? "border-[var(--doorli-mint)]" : ""}`}><Icon className="w-5 h-5 text-[var(--doorli-mint)]" /><p className="text-sm font-semibold mt-3">{String(label)}</p></button>)}</div><form onSubmit={book} className="doorli-glass rounded-3xl p-6 space-y-4"><h2 className="font-display text-xl font-bold capitalize">Book a {type} service</h2><label className="block text-sm text-white/70">Provider<select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white" required>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.specialty} · LKR {provider.fee}</option>)}</select></label><label className="block text-sm text-white/70">Date and time<input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white" required /></label><label className="block text-sm text-white/70">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full min-h-24 bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" placeholder="Tell the provider anything important" /></label>{message && <p className="text-sm text-[var(--doorli-mint)]">{message}</p>}{error && <p className="text-sm text-amber-200">{error}</p>}<button className="doorli-cta-primary w-full justify-center">Book appointment</button></form></div></main>;
}
