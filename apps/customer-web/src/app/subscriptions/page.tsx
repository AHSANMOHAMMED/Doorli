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

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/subscriptions");
      return;
    }
    apiFetch<Sub[]>("/subscriptions/my")
      .then((d) => setSubs(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message));
  }, []);

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
