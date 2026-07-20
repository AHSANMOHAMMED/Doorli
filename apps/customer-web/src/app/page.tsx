"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Utensils,
  Hotel,
  CalendarDays,
  PartyPopper,
  Wrench,
  Truck,
  Sparkles,
  Car,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { UniversalSearch } from "@/components/UniversalSearch";
import { apiFetch, clearCustomerToken, getCustomerToken } from "@/lib/api";

const MARK = "/brand/doorli-mark.svg";

/** LocalConnect core features — each maps to vendor category or dedicated flow */
const CORE_FEATURES = [
  {
    name: "Local Marketplace",
    blurb: "Groceries, bakery, hardware — real-time stock & doorstep delivery.",
    slug: "grocery",
    href: "/search?category=grocery",
    icon: Store,
    tint: "bg-[#185FA5]/25 text-[#B5D4F4]",
    erp: "Orders + inventory sync to ERP when shop linked",
  },
  {
    name: "Food & Dining",
    blurb: "Restaurants & cloud kitchens — menus, customise, live track.",
    slug: "restaurant",
    href: "/search?category=restaurant",
    icon: Utensils,
    tint: "bg-[#FAC775]/20 text-[var(--doorli-gold)]",
    erp: "Kitchen tickets sync as ERP sales",
  },
  {
    name: "Hotels & Rooms",
    blurb: "Hotels, guesthouses, villas — live availability, instant book.",
    slug: "hotel",
    href: "/search?category=hotel",
    icon: Hotel,
    tint: "bg-[#378ADD]/20 text-[#B5D4F4]",
    erp: "Bookings → ERP reservations",
  },
  {
    name: "Halls & Venues",
    blurb: "Wedding halls, banquet & conference spaces.",
    slug: "hall",
    href: "/search?category=hall",
    icon: CalendarDays,
    tint: "bg-[#5DCAA5]/20 text-[var(--doorli-mint)]",
    erp: "Venue bookings → ERP calendar",
  },
  {
    name: "Event Planning",
    blurb: "Venue, catering, décor & entertainment in one package.",
    slug: "events",
    href: "/events",
    icon: PartyPopper,
    tint: "bg-[#FAC775]/15 text-[var(--doorli-gold)]",
    erp: "Event packages linked to ERP jobs",
  },
  {
    name: "Home Services",
    blurb: "Plumber, electrician, AC, cleaner — verified pros.",
    slug: "service",
    href: "/search?category=service",
    icon: Wrench,
    tint: "bg-[#1D9E75]/25 text-[var(--doorli-mint)]",
    erp: "Service jobs → ERP work orders",
  },
  {
    name: "Delivery & Transport",
    blurb: "Live driver tracking, transparent fees, shop to door.",
    slug: "delivery",
    href: "/orders",
    icon: Truck,
    tint: "bg-[#185FA5]/20 text-[#B5D4F4]",
    erp: "Dispatch status mirrors ERP fulfillment",
  },
  {
    name: "Beauty & Wellness",
    blurb: "Salons, spas, clinics — book slots without calls.",
    slug: "beauty",
    href: "/search?category=beauty",
    icon: Sparkles,
    tint: "bg-[#FAC775]/20 text-[var(--doorli-gold)]",
    erp: "Appointments → ERP bookings",
  },
  {
    name: "Rides",
    blurb: "Request a ride nearby — track your driver live.",
    slug: "rides",
    href: "/ride",
    icon: Car,
    tint: "bg-[#378ADD]/25 text-[#B5D4F4]",
    erp: "Ride fares can settle via ERP ledger",
  },
  {
    name: "Emergency SOS",
    blurb: "Fast help when you need it most.",
    slug: "sos",
    href: "/search?category=service",
    icon: ShieldAlert,
    tint: "bg-red-500/20 text-red-300",
    erp: "Priority tickets in ops / ERP",
  },
];

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  isOpen?: boolean;
};

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(() => !!getCustomerToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiFetch<{ items: Vendor[] } | Vendor[]>("/vendors");
        const items = Array.isArray(d) ? d : d?.items || [];
        if (!cancelled) setVendors(items.slice(0, 9));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load vendors");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen text-[var(--doorli-text)] selection:bg-[#185FA5]/40">
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden doorli-hero-plane">
        <div className="doorli-orb doorli-orb--a" aria-hidden />
        <div className="doorli-orb doorli-orb--b" aria-hidden />
        <div className="doorli-orb doorli-orb--c" aria-hidden />

        <nav className="relative z-30 w-full shrink-0">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MARK} alt="" className="w-9 h-9 rounded-xl shadow-lg shadow-black/30" />
              <span className="font-display text-lg font-semibold tracking-tight text-white">Doorli</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/ride" className="hidden md:inline text-sm text-white/75 hover:text-white">
                Ride
              </Link>
              {loggedIn ? (
                <>
                  <Link href="/orders" className="text-sm font-medium text-white/75 hover:text-white">
                    Orders
                  </Link>
                  <button
                    type="button"
                    className="text-sm font-medium text-white/75 hover:text-white"
                    onClick={() => {
                      clearCustomerToken();
                      setLoggedIn(false);
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link href="/login" className="doorli-cta-primary text-sm py-2.5 px-4 shadow-none">
                  Log In
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="relative z-20 flex-1 flex flex-col justify-center px-5 sm:px-8 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto w-full text-center">
            <div className="doorli-rise flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MARK}
                alt="Doorli"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-[1.75rem] shadow-[0_24px_80px_rgba(0,0,0,0.45)] mb-7 ring-1 ring-white/20"
              />
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white">
                Doorli
              </h1>
              <p className="font-display mt-3 text-xl sm:text-2xl md:text-[1.75rem] font-semibold text-white leading-snug">
                Everything local. Delivered.
              </p>
              <p className="doorli-rise-delay mt-4 text-base sm:text-lg text-[#b5c9df] max-w-lg mx-auto leading-relaxed">
                Marketplace, food, hotels, halls, services, beauty, delivery & rides — one neighborhood app,
                connected to ERP behind the counter.
              </p>
            </div>

            <div className="doorli-rise-delay-2 max-w-2xl mx-auto mt-9 sm:mt-11 relative z-40">
              <UniversalSearch />
            </div>

            <div className="doorli-rise-delay-2 mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/search?category=grocery" className="doorli-cta-ghost text-sm py-2.5 px-4">
                Browse marketplace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ride" className="doorli-cta-ghost text-sm py-2.5 px-4">
                Book a ride
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-5 sm:px-8 bg-[#07101f] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            LocalConnect core
          </h2>
          <p className="mt-3 text-[#9bb4d0] text-lg max-w-2xl">
            Every vertical below is a Doorli flow. Shops with an ERP link sync stock and orders automatically.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_FEATURES.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className="group p-5 sm:p-6 rounded-2xl doorli-glass hover:bg-white/[0.14] transition-colors flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.tint}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-white text-lg group-hover:text-[var(--doorli-mint)] transition-colors">
                  {f.name}
                </h3>
                <p className="mt-2 text-sm text-[#9bb4d0] leading-relaxed flex-1">{f.blurb}</p>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-white/35">{f.erp}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-5 sm:px-8 pb-24 bg-[#050b18]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">Nearby vendors</h2>
          <p className="mt-3 text-[#9bb4d0]">Open shops and kitchens ready for your order.</p>
          {error && <p className="text-[var(--doorli-gold)] mt-4 text-sm">{error}</p>}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <Link
                key={v.id}
                href={`/shop/${v.id}`}
                className="p-6 rounded-2xl doorli-glass hover:bg-white/[0.12] transition block"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--doorli-mint)] mb-2">{v.category}</p>
                <h3 className="font-display text-xl font-semibold text-white">{v.businessName}</h3>
                <p className="text-[#9bb4d0] text-sm mt-2 line-clamp-2">{v.description || v.city}</p>
                <p className="text-xs mt-4 text-[var(--doorli-mint)]">{v.isOpen !== false ? "Open now" : "Closed"}</p>
              </Link>
            ))}
            {loading && vendors.length === 0 && (
              <p className="text-white/45 col-span-full">Loading vendors…</p>
            )}
            {!loading && vendors.length === 0 && !error && (
              <p className="text-white/45 col-span-full">No vendors yet. Check back soon.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
