"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Car, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
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
  const [vehicleType, setVehicleType] = useState<"bike" | "car" | "van" | "truck">("car");
  const [estimate, setEstimate] = useState<{ totalFare: number; distanceKm: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn] = useState(() => !!getCustomerToken());
  const [rides, setRides] = useState<Array<{ id: string; status: string; totalFare: number; vehicleType: string; createdAt: string; pickupAddress?: string | null; dropoffAddress?: string | null }>>([]);

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
        vehicleType,
      }),
    })
      .then(setEstimate)
      .catch(() => setEstimate(null));
  }, [pickup, dropoff, vehicleType]);

  async function loadRides() {
    if (!getCustomerToken()) return;
    try { setRides(await apiFetch<typeof rides>("/rides/my")); } catch { /* form errors remain actionable */ }
  }

  useEffect(() => { void loadRides(); }, []);

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
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({
            pickupAddress: pickup,
            dropoffAddress: dropoff,
            vehicleType,
            pickupLat: pickupC.lat,
            pickupLng: pickupC.lng,
            dropoffLat: dropC.lat,
            dropoffLng: dropC.lng,
          }),
        },
      );
      await loadRides();
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

          <fieldset>
            <legend className="text-sm text-white/80">Vehicle type</legend>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {(["bike", "car", "van", "truck"] as const).map((type) => (
                <button type="button" key={type} onClick={() => setVehicleType(type)} className={`capitalize rounded-xl border px-2 py-3 text-xs ${vehicleType === type ? "border-[var(--doorli-mint)] bg-[var(--doorli-teal)]/20 text-white" : "border-white/15 text-white/60"}`}>
                  {type}
                </button>
              ))}
            </div>
          </fieldset>
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
        <section className="doorli-glass rounded-2xl p-6 mt-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your rides</h2><button type="button" onClick={() => void loadRides()} className="text-white/60 hover:text-white" aria-label="Refresh rides"><RefreshCw className="w-4 h-4" /></button></div>
          <div className="mt-4 space-y-3">
            {rides.length === 0 && <p className="text-sm text-white/45">No rides yet.</p>}
            {rides.map((ride) => <div key={ride.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium capitalize">{ride.status.replace(/_/g, " ")} · {ride.vehicleType}</p><p className="text-xs text-white/50 mt-1">{ride.pickupAddress || "Pickup"} to {ride.dropoffAddress || "Drop-off"}</p><p className="text-xs text-white/40 mt-1">{new Date(ride.createdAt).toLocaleString()}</p></div><span className="text-sm text-[var(--doorli-gold)]">LKR {Number(ride.totalFare).toLocaleString()}</span></div>{["searching", "assigned", "arrived", "in_transit"].includes(ride.status) && <button type="button" onClick={async () => { try { await apiFetch(`/rides/${ride.id}/cancel`, { method: "PATCH" }); await loadRides(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to cancel ride."); } }} className="mt-3 text-xs text-rose-300 inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cancel ride</button>}</div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
