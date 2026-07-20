"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearCustomerToken, getCustomerToken } from "@/lib/api";

type Loyalty = { points: number; earned: number; redeemed: number };
type City = { id: string; name: string; city?: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(() => !!getCustomerToken());
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("doorli_city") || "Colombo" : "Colombo",
  );

  useEffect(() => {
    const token = loggedIn;
    apiFetch<City[]>("/cities")
      .then((d) => setCities(Array.isArray(d) ? d : []))
      .catch(() => undefined);
    if (token) {
      apiFetch<Loyalty>("/loyalty/me")
        .then(setLoyalty)
        .catch(() => undefined);
    }
  }, [loggedIn]);

  return (
    <main className="min-h-screen doorli-hero-plane text-white px-5 pt-10 pb-8">
      <h1 className="font-display text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-[#9bb4d0]">Account, city & loyalty</p>

      <div className="mt-8 space-y-3 max-w-md">
        <label className="block doorli-glass rounded-2xl p-4">
          <span className="text-xs uppercase tracking-wide text-white/45">City</span>
          <select
            className="mt-2 w-full bg-transparent border-0 text-white min-h-11"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              localStorage.setItem("doorli_city", e.target.value);
            }}
          >
            {(cities.length ? cities.map((c) => c.city || c.name) : ["Colombo", "Kandy", "Galle", "Jaffna"]).map(
              (c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ),
            )}
          </select>
        </label>

        {loyalty && (
          <div className="doorli-glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">Loyalty points</p>
            <p className="text-2xl font-display font-bold text-[var(--doorli-gold)] mt-1">{loyalty.points}</p>
            <p className="text-xs text-white/45 mt-1">
              Earned {loyalty.earned} · Redeemed {loyalty.redeemed}
            </p>
          </div>
        )}

        {loggedIn ? (
          <>
            <Link href="/orders" className="block p-4 rounded-2xl doorli-glass min-h-11">
              My orders
            </Link>
            <Link href="/events" className="block p-4 rounded-2xl doorli-glass min-h-11">
              Event planning
            </Link>
            <Link href="/subscriptions" className="block p-4 rounded-2xl doorli-glass min-h-11">
              Subscriptions
            </Link>
            <Link href="/ride" className="block p-4 rounded-2xl doorli-glass min-h-11">
              Rides
            </Link>
            <Link href="/checkout" className="block p-4 rounded-2xl doorli-glass min-h-11">
              Cart / checkout
            </Link>
            <button
              type="button"
              className="w-full text-left p-4 rounded-2xl doorli-glass text-amber-200 min-h-11"
              onClick={() => {
                clearCustomerToken();
                setLoggedIn(false);
                router.push("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login" className="doorli-cta-primary inline-flex">
            Log in
          </Link>
        )}
        <Link href="/vendor/login" className="block p-4 rounded-2xl doorli-glass text-sm text-[#9bb4d0]">
          Vendor portal →
        </Link>
      </div>
    </main>
  );
}
