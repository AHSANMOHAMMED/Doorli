"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

const MARK = "/brand/doorli-mark.svg";

// Simple Colombo landmarks for demo fare estimates
const PLACE_COORDS: Record<string, { lat: number; lng: number }> = {
  "colombo fort": { lat: 6.9344, lng: 79.8428 },
  "galle face": { lat: 6.9271, lng: 79.8449 },
  "bambalapitiya": { lat: 6.899, lng: 79.855 },
  "wellawatte": { lat: 6.877, lng: 79.86 },
  "nugegoda": { lat: 6.8649, lng: 79.8997 },
  default: { lat: 6.9271, lng: 79.8612 },
};

function coordsFor(address: string) {
  const key = address.trim().toLowerCase();
  for (const [k, v] of Object.entries(PLACE_COORDS)) {
    if (key.includes(k)) return v;
  }
  return PLACE_COORDS.default;
}

export default function RidePage() {
  const [pickup, setPickup] = useState("Colombo Fort");
  const [dropoff, setDropoff] = useState("Galle Face");
  const [estimate, setEstimate] = useState<{ totalFare: number; distanceKm: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn] = useState(() => !!getCustomerToken());

  useEffect(() => {
    const pickupC = coordsFor(pickup);
    const dropC = coordsFor(dropoff);
    apiFetch<{ totalFare: number; distanceKm: number }>("/rides/estimate", {
      method: "POST",
      body: JSON.stringify({
        pickupLat: pickupC.lat,
        pickupLng: pickupC.lng,
        dropoffLat: dropC.lat,
        dropoffLng: dropC.lng,
      }),
    })
      .then(setEstimate)
      .catch(() => setEstimate(null));
  }, [pickup, dropoff]);

  async function requestRide(e: FormEvent) {
    e.preventDefault();
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/ride");
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const pickupC = coordsFor(pickup);
      const dropC = coordsFor(dropoff);
      const data = await apiFetch<{ id?: string; status?: string; message?: string; totalFare?: number }>(
        "/rides",
        {
          method: "POST",
          body: JSON.stringify({
            pickupAddress: pickup,
            dropoffAddress: dropoff,
            pickupLat: pickupC.lat,
            pickupLng: pickupC.lng,
            dropoffLat: dropC.lat,
            dropoffLng: dropC.lng,
          }),
        },
      );
      setStatus(
        data.status
          ? `Ride ${data.status}${data.id ? ` · #${data.id.slice(0, 8)}` : ""}${
              data.totalFare != null ? ` · LKR ${data.totalFare}` : ""
            }`
          : data.message || "Ride requested — searching for a driver…",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ride service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3.5 text-white min-h-11 focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]";

  return (
    <main className="min-h-screen doorli-hero-plane relative text-white">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 pb-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8 min-h-11">
          <ArrowLeft className="w-4 h-4" />
          Back to Doorli
        </Link>

        <div className="flex items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} alt="" className="w-12 h-12 rounded-xl" />
          <div>
            <h1 className="font-display text-3xl font-bold">Rides</h1>
            <p className="text-sm text-[#9bb4d0]">LocalConnect transport</p>
          </div>
        </div>

        <form onSubmit={requestRide} className="doorli-glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-[var(--doorli-mint)] mb-2">
            <Car className="w-5 h-5" />
            <span className="text-sm font-medium">Request a nearby ride</span>
          </div>

          <label className="block text-sm text-white/80">
            Pickup
            <input className={`mt-1.5 ${inputClass}`} value={pickup} onChange={(e) => setPickup(e.target.value)} required />
          </label>
          <label className="block text-sm text-white/80">
            Drop-off
            <input className={`mt-1.5 ${inputClass}`} value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
          </label>

          {estimate && (
            <p className="text-sm text-white/70">
              Est. {estimate.distanceKm} km · <span className="text-[var(--doorli-gold)] font-semibold">LKR {estimate.totalFare}</span>
            </p>
          )}
          {error && <p className="text-sm text-amber-200">{error}</p>}
          {status && <p className="text-sm text-[var(--doorli-mint)]">{status}</p>}

          <button type="submit" disabled={loading} className="w-full doorli-cta-primary justify-center min-h-12 disabled:opacity-50">
            {loading ? "Requesting…" : loggedIn ? "Request ride" : "Log in to request ride"}
          </button>
        </form>
      </div>
    </main>
  );
}
