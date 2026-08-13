"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BusFront, Car, MapPinned, ParkingCircle, QrCode, Search } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Route = { id: string; origin: string; destination: string; operator: string; fareMin: number; departTimes: string[] };
type Plan = { totalFare: number; totalDurationMins: number; legs: Array<{ type: string; from: string; to: string; durationMins: number; fare: number }> };

export default function MobilityPage() {
  const [from, setFrom] = useState("Colombo");
  const [to, setTo] = useState("Galle");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [parking, setParking] = useState<Array<{ id: string; name: string; availableSpaces: number; ratePerHour: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Route[]>(`/transit/bus/routes?q=${encodeURIComponent(`${from} ${to}`)}`)
      .then(setRoutes)
      .catch(() => setRoutes([]));
    apiFetch<typeof parking>("/transit/parking")
      .then(setParking)
      .catch(() => setParking([]));
  }, [from, to]);

  async function searchPlan(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setPlan(await apiFetch<Plan>(`/transit/journey-plan?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Journey planner unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="doorli-page-shell text-white">
      <div className="max-w-5xl mx-auto px-5 py-10 pb-28 space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Doorli</Link>
        <header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Daily movement</p><h1 className="font-display text-4xl font-bold mt-2">Mobility hub</h1><p className="text-white/60 mt-2">Plan a mixed journey, book a bus seat, or request a Doorli ride.</p></header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["/ride", Car, "Request a ride"], ["#bus", BusFront, "Bus tickets"], ["#planner", MapPinned, "Journey planner"], ["#parking", ParkingCircle, "Parking"]].map(([href, Icon, label]) => <Link key={String(href)} href={String(href)} className="doorli-glass-card rounded-2xl p-4 hover:border-[var(--doorli-mint)]/50"><Icon className="w-5 h-5 text-[var(--doorli-mint)]" /><p className="text-sm font-semibold mt-3">{String(label)}</p></Link>)}</div>

        <section id="planner" className="doorli-glass rounded-3xl p-6">
          <div className="flex items-center gap-2"><Search className="w-5 h-5 text-[var(--doorli-gold)]" /><h2 className="font-display text-xl font-bold">Journey planner</h2></div>
          <form onSubmit={searchPlan} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 mt-4"><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="bg-black/25 border border-white/15 rounded-xl px-4 py-3" required /><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" className="bg-black/25 border border-white/15 rounded-xl px-4 py-3" required /><button className="doorli-cta-primary justify-center">{loading ? "Planning..." : "Plan journey"}</button></form>
          {error && <p className="text-sm text-amber-200 mt-3">{error}</p>}
          {plan && <div className="mt-5 rounded-2xl bg-white/5 p-4"><div className="flex justify-between text-sm"><span>{plan.totalDurationMins} minutes</span><span className="text-[var(--doorli-gold)]">From LKR {plan.totalFare}</span></div><div className="mt-4 space-y-2">{plan.legs.map((leg, index) => <div key={`${leg.type}-${index}`} className="flex items-center gap-3 text-sm"><span className="capitalize text-[var(--doorli-mint)]">{leg.type}</span><span className="text-white/60">{leg.from} to {leg.to}</span></div>)}</div></div>}
        </section>

        <section id="bus" className="doorli-glass rounded-3xl p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Bus routes</h2><p className="text-sm text-white/50 mt-1">Choose a route to continue to schedule and seats.</p></div><QrCode className="w-6 h-6 text-[var(--doorli-gold)]" /></div><div className="grid md:grid-cols-2 gap-3 mt-5">{routes.map((route) => <div key={route.id} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{route.origin} to {route.destination}</p><p className="text-xs text-white/50 mt-1">{route.operator} · {route.departTimes.join(" · ")}</p></div><span className="text-sm text-[var(--doorli-gold)]">LKR {route.fareMin}+</span></div><Link href={`/mobility/bus?route=${route.id}`} className="inline-block mt-4 text-sm text-[var(--doorli-mint)] hover:underline">View seats</Link></div>)}{!routes.length && <p className="text-sm text-white/45">No direct bus routes found. Try another city pair.</p>}</div></section>

        <section id="parking" className="doorli-glass rounded-3xl p-6"><h2 className="font-display text-xl font-bold">Nearby parking</h2><div className="grid md:grid-cols-3 gap-3 mt-4">{parking.map((lot) => <div key={lot.id} className="rounded-2xl border border-white/10 p-4"><p className="font-semibold">{lot.name}</p><p className="text-sm text-[var(--doorli-mint)] mt-2">{lot.availableSpaces} spaces available</p><p className="text-xs text-white/50 mt-1">LKR {lot.ratePerHour}/hour</p></div>)}</div></section>
        <p className="text-xs text-white/40">Bus seat reservations require login and use your Doorli Wallet at confirmation.</p>
        {!getCustomerToken() && <Link href="/login?next=/mobility" className="text-sm text-[var(--doorli-mint)] hover:underline">Log in to book tickets</Link>}
      </div>
    </main>
  );
}
