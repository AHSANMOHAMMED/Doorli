"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Award, ShoppingBag, CalendarDays, Car, ShoppingCart, LogOut, User, ArrowLeft, Crown } from "lucide-react";
import { apiFetch, clearCustomerToken, getCustomerToken } from "@/lib/api";

type Loyalty = { points: number; earned: number; redeemed: number };
type City = { id: string; name: string; city?: string | null };

const MENU_ITEMS = [
  { href: "/orders", icon: ShoppingBag, label: "My orders", description: "Track your purchases" },
  { href: "/events", icon: CalendarDays, label: "Event planning", description: "Manage your events" },
  { href: "/subscriptions", icon: Crown, label: "Subscriptions", description: "Scheduled deliveries" },
  { href: "/ride", icon: Car, label: "Rides", description: "Transport history" },
  { href: "/checkout", icon: ShoppingCart, label: "Cart", description: "View your cart" },
];

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
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10 pb-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Doorli
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#185FA5] to-[#1D9E75] flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">My Profile</h1>
            <p className="text-[#9bb4d0] mt-1">Account settings & preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="doorli-glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-[var(--doorli-mint)]" />
              <span className="text-sm uppercase tracking-wide text-white/45">Your City</span>
            </div>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]"
              value={city}
              title="Select your city"
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
          </div>

          {loyalty && (
            <div className="doorli-glass-card rounded-2xl p-5 bg-gradient-to-br from-[var(--doorli-gold)]/10 to-transparent border-[var(--doorli-gold)]/30">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-5 h-5 text-[var(--doorli-gold)]" />
                <span className="text-sm uppercase tracking-wide text-white/45">Loyalty Points</span>
              </div>
              <p className="text-4xl font-display font-bold text-[var(--doorli-gold)]">{loyalty.points.toLocaleString()}</p>
              <div className="flex gap-6 mt-3 text-sm">
                <span className="text-white/60">Earned: {loyalty.earned}</span>
                <span className="text-white/60">Redeemed: {loyalty.redeemed}</span>
              </div>
            </div>
          )}

          {loggedIn ? (
            <>
              <div className="grid gap-3">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="doorli-glass-card rounded-xl p-4 hover:bg-white/[0.08] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <Icon className="w-5 h-5 text-[var(--doorli-mint)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-white/50">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                className="w-full doorli-glass-card rounded-xl p-4 text-amber-200 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center gap-4"
                onClick={() => {
                  clearCustomerToken();
                  setLoggedIn(false);
                  router.push("/");
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="doorli-cta-primary inline-flex justify-center w-full">
              Log in to access your account
            </Link>
          )}

          <Link href="/vendor/login" className="block doorli-glass rounded-xl p-4 text-center text-sm text-[#9bb4d0] hover:text-white transition-colors">
            Are you a vendor? <span className="text-[var(--doorli-mint)]">Open vendor portal →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
