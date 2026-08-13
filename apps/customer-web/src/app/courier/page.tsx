"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileBox, PackageCheck } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

export default function CourierPage() {
  const [type, setType] = useState<"package" | "document">("package");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createJob(event: FormEvent) {
    event.preventDefault();
    if (!getCustomerToken()) { window.location.assign("/login?next=/courier"); return; }
    try {
      const data = await apiFetch<{ jobRef: string; fareEstimate: number }>("/courier/jobs", { method: "POST", body: JSON.stringify({ type, pickupAddress, dropoffAddress, pickupLat: 6.9271, pickupLng: 79.8612, dropoffLat: 6.9344, dropoffLng: 79.8428, deliveryWindow: "same_day", requiresSignature: type === "document" }) });
      setResult(`${data.jobRef} created. Estimated fare: LKR ${data.fareEstimate}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create courier job."); }
  }

  return <main className="doorli-page-shell text-white"><div className="max-w-xl mx-auto px-5 py-10 pb-28 space-y-7"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Doorli</Link><header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Courier and errands</p><h1 className="font-display text-4xl font-bold mt-2">Send it locally</h1><p className="text-white/60 mt-2">Same-day package and document pickup with Doorli runners.</p></header><form onSubmit={createJob} className="doorli-glass rounded-3xl p-6 space-y-4"><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setType("package")} className={`rounded-xl border p-4 text-left ${type === "package" ? "border-[var(--doorli-mint)] bg-white/10" : "border-white/15"}`}><PackageCheck className="w-5 h-5 text-[var(--doorli-mint)]" /><p className="text-sm font-semibold mt-2">Package</p></button><button type="button" onClick={() => setType("document")} className={`rounded-xl border p-4 text-left ${type === "document" ? "border-[var(--doorli-mint)] bg-white/10" : "border-white/15"}`}><FileBox className="w-5 h-5 text-[var(--doorli-gold)]" /><p className="text-sm font-semibold mt-2">Document</p></button></div><label className="block text-sm text-white/70">Pickup address<input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" required minLength={5} /></label><label className="block text-sm text-white/70">Drop-off address<input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" required minLength={5} /></label>{result && <p className="text-sm text-[var(--doorli-mint)]">{result}</p>}{error && <p className="text-sm text-amber-200">{error}</p>}<button className="doorli-cta-primary w-full justify-center">Create courier job</button></form></div></main>;
}
