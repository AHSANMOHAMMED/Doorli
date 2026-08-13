"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Sub = {
  id: string;
  frequency: string;
  deliveryAddress: string;
  nextDeliveryAt: string;
  status?: string;
};
type Premium = { active: boolean; tier?: string | null; nextRenewalAt?: string; totalSavings?: number };

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [premium, setPremium] = useState<Premium | null>(null);
  const [premiumMessage, setPremiumMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/subscriptions");
      return;
    }
    apiFetch<Sub[]>("/subscriptions/my")
      .then((d) => setSubs(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message));
    apiFetch<Premium>("/membership/status").then(setPremium).catch(() => setPremium({ active: false }));
  }, []);

  async function subscribe(tier: "monthly" | "annual") {
    try {
      const result = await apiFetch<Premium>("/membership/subscribe", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ tier }) });
      setPremium({ ...result, active: true });
      setPremiumMessage("Doorli Premium is active.");
    } catch (e) { setPremiumMessage(e instanceof Error ? e.message : "Unable to activate Premium."); }
  }

  async function cancelPremium() {
    try { const result = await apiFetch<{ activeUntil: string }>("/membership/cancel", { method: "POST" }); setPremium((current) => current ? { ...current, active: true, nextRenewalAt: result.activeUntil } : current); setPremiumMessage("Premium will remain active until the end of this billing period."); } catch (e) { setPremiumMessage(e instanceof Error ? e.message : "Unable to cancel Premium."); }
  }

  return (
    <main className="min-h-screen doorli-hero-plane text-white px-5 py-10 pb-28">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex justify-between">
          <h1 className="font-display text-3xl font-bold">Subscriptions</h1>
          <Link href="/profile" className="text-sm text-white/60">
            Profile
          </Link>
        </div>
        <p className="text-[#9bb4d0]">Scheduled grocery deliveries from your favourite shops.</p>
        <section className="doorli-glass rounded-2xl p-5 space-y-4">
          <div><p className="text-xs uppercase tracking-wider text-[var(--doorli-gold)]">Daily habit layer</p><h2 className="font-display text-2xl font-bold mt-1">Doorli Premium</h2><p className="text-sm text-white/55 mt-1">Free delivery perks and priority service for your local life.</p></div>
          {premium?.active ? <><p className="text-sm text-[var(--doorli-mint)]">{premium.tier} membership active · renews {premium.nextRenewalAt ? new Date(premium.nextRenewalAt).toLocaleDateString() : "soon"}</p><button type="button" onClick={() => void cancelPremium()} className="text-sm text-white/60 underline">Cancel at renewal</button></> : <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => void subscribe("monthly")} className="doorli-cta-primary justify-center">LKR 299 / month</button><button type="button" onClick={() => void subscribe("annual")} className="doorli-cta-ghost justify-center">LKR 2,499 / year</button></div>}
          {premiumMessage && <p className="text-sm text-white/65">{premiumMessage}</p>}
        </section>
        {error && <p className="text-amber-200 text-sm">{error}</p>}
        {subs.length === 0 && !error && (
          <p className="text-white/45">No subscriptions yet. Create one from a shop after checkout.</p>
        )}
        {subs.map((s) => (
          <div key={s.id} className="doorli-glass rounded-2xl p-4">
            <p className="font-semibold capitalize">{s.frequency}</p>
            <p className="text-sm text-white/55 mt-1">{s.deliveryAddress}</p>
            <p className="text-xs text-white/40 mt-2">
              Next: {new Date(s.nextDeliveryAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
