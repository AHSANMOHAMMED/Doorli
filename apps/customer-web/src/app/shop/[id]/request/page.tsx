"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Vendor = { id: string; businessName: string; category: string };

export default function ServiceRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [serviceType, setServiceType] = useState("plumbing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("Colombo");
  const [isUrgent, setIsUrgent] = useState(false);
  const [offeredRate, setOfferedRate] = useState("2500");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace(`/login?next=/shop/${id}/request`);
      return;
    }
    apiFetch<Vendor>(`/vendors/${id}`)
      .then(setVendor)
      .catch((e) => setError(e.message));
  }, [id, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/service-requests", {
        method: "POST",
        body: JSON.stringify({
          serviceType,
          title: title.trim() || `${serviceType} request for ${vendor?.businessName || "pro"}`,
          description: description || undefined,
          addressLine,
          latitude: 6.9271,
          longitude: 79.8612,
          isUrgent,
          offeredRate: parseFloat(offeredRate) || undefined,
        }),
      });
      window.location.assign("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setSaving(false);
    }
  }

  const input =
    "mt-1.5 w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]";

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 space-y-6">
        <Link href={`/shop/${id}`} className="text-sm text-white/70 hover:text-white">
          ← Back
        </Link>
        <h1 className="font-display text-3xl font-bold">Request a pro</h1>
        <p className="text-sm text-[#9bb4d0]">
          Home services via {vendor?.businessName || "…"} · becomes an ERP work order when linked
        </p>

        {error && <p className="text-amber-200 text-sm">{error}</p>}

        <form method="post" action="#" onSubmit={onSubmit} className="doorli-glass rounded-2xl p-6 space-y-4">
          <label className="block text-sm">
            Service type
            <select className={input} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="ac">AC / HVAC</option>
              <option value="carpentry">Carpentry</option>
              <option value="cleaning">Cleaning</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            Title
            <input
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leaking kitchen tap"
              minLength={5}
              required
            />
          </label>
          <label className="block text-sm">
            Details
            <textarea className={input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block text-sm">
            Address
            <input className={input} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Offered rate (LKR)
            <input className={input} value={offeredRate} onChange={(e) => setOfferedRate(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            Urgent
          </label>
          <button type="submit" disabled={saving} className="w-full doorli-cta-primary justify-center disabled:opacity-50">
            {saving ? "Sending…" : "Post service request"}
          </button>
        </form>
      </div>
    </main>
  );
}
