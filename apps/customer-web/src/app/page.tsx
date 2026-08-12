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
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Smartphone,
  Shield,
  Zap,
  TrendingUp,
  MessageSquare,
  Building2,
} from "lucide-react";
import { UniversalSearch } from "@/components/UniversalSearch";
import { apiFetch, clearCustomerToken, getCustomerToken } from "@/lib/api";

const MARK = "/brand/doorli-mark.svg";

/** Core feature categories */
const CORE_FEATURES = [
  {
    name: "Local Marketplace",
    blurb: "Groceries, bakery & daily needs — real-time stock & 15-min delivery.",
    slug: "grocery",
    href: "/search?category=grocery",
    icon: Store,
    badge: "15 MINS",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    gradient: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-cyan-300",
    erp: "Orders + inventory sync to ERP automatically",
  },
  {
    name: "Food & Dining",
    blurb: "Top restaurants & cloud kitchens — customize menus & track live.",
    slug: "restaurant",
    href: "/search?category=restaurant",
    icon: Utensils,
    badge: "HOT DEALS",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300",
    erp: "Kitchen tickets sync directly to ERP sales",
  },
  {
    name: "Hotels & Stays",
    blurb: "Hotels, guesthouses & luxury villas — instant live booking.",
    slug: "hotel",
    href: "/search?category=hotel",
    icon: Hotel,
    badge: "VERIFIED",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    gradient: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-blue-300",
    erp: "Bookings → Real-time ERP reservations",
  },
  {
    name: "Halls & Venues",
    blurb: "Wedding halls, banquets & corporate event spaces.",
    slug: "hall",
    href: "/search?category=hall",
    icon: CalendarDays,
    badge: "PREMIUM",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    gradient: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300",
    erp: "Venue calendar linked with ERP",
  },
  {
    name: "Event Planning",
    blurb: "Venue, catering, décor & entertainment in one package.",
    slug: "events",
    href: "/events",
    icon: PartyPopper,
    badge: "ALL-IN-ONE",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    gradient: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300",
    erp: "Event packages linked to ERP jobs",
  },
  {
    name: "Home Services",
    blurb: "Plumbers, electricians, AC repair & cleaners — verified pros.",
    slug: "service",
    href: "/search?category=service",
    icon: Wrench,
    badge: "PROS",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    gradient: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-300",
    erp: "Service tickets → ERP work orders",
  },
  {
    name: "Delivery & Transport",
    blurb: "Live driver tracking, transparent fees, shop to doorstep.",
    slug: "delivery",
    href: "/orders",
    icon: Truck,
    badge: "EXPRESS",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    gradient: "from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-300",
    erp: "Dispatch mirrors ERP fulfillment status",
  },
  {
    name: "Beauty & Wellness",
    blurb: "Salons, spas & wellness clinics — instant slot booking.",
    slug: "beauty",
    href: "/search?category=beauty",
    icon: Sparkles,
    badge: "BOOK NOW",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    gradient: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30 text-fuchsia-300",
    erp: "Appointments → ERP calendar",
  },
  {
    name: "Rides & Taxis",
    blurb: "Request a ride nearby — track your driver live on the map.",
    slug: "rides",
    href: "/ride",
    icon: Car,
    badge: "INSTANT",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    gradient: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-300",
    erp: "Ride fares settle via ERP ledger",
  },
  {
    name: "Community Forums",
    blurb: "Engage with neighbors, local events & community discussions.",
    slug: "forums",
    href: "/forums",
    icon: MessageSquare,
    badge: "COMMUNITY",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    gradient: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300",
    erp: "Public engagement portal",
  },
  {
    name: "Emergency SOS",
    blurb: "Fast priority assistance when you need help most.",
    slug: "sos",
    href: "/sos",
    icon: ShieldAlert,
    badge: "24/7 HELP",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    gradient: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300",
    erp: "Priority emergency ticket dispatch",
  },
  {
    name: "Gov Services",
    blurb: "Pay taxes, apply for permits & report civic issues.",
    slug: "gov",
    href: "/gov",
    icon: Shield,
    badge: "E-GOV",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    gradient: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-300",
    erp: "Municipal council API sync",
  }
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
  const [activeTab, setActiveTab] = useState<string>("all");
  const [mobilePreview, setMobilePreview] = useState<boolean>(false);
  const [vendorCount, setVendorCount] = useState(0);
  const [avgRating, setAvgRating] = useState("4.9");

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await apiFetch<{ totalVendors?: number; total?: number; avgRating?: number | string; rating?: number | string }>("/vendors/stats");
        if (!cancelled) {
          setVendorCount(stats?.totalVendors || stats?.total || 0);
          const r = stats?.avgRating ?? stats?.rating ?? "4.9";
          setAvgRating(String(r));
        }
      } catch {
        // Keep defaults on failure
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredFeatures = activeTab === "all" 
    ? CORE_FEATURES 
    : CORE_FEATURES.filter(f => f.slug === activeTab || (activeTab === "marketplace" && ["grocery", "delivery"].includes(f.slug)));

  return (
    <main className="min-h-screen text-[var(--doorli-text)] selection:bg-[#185FA5]/40 relative">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden doorli-hero-plane pb-16">
        <div className="doorli-orb doorli-orb--a" aria-hidden />
        <div className="doorli-orb doorli-orb--b" aria-hidden />
        <div className="doorli-orb doorli-orb--c" aria-hidden />

        {/* Global Navigation Header */}
        <nav className="relative z-30 w-full shrink-0 border-b border-white/10 bg-[#081326]/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-18 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MARK} alt="Doorli" className="w-10 h-10 rounded-xl shadow-lg shadow-black/40 border border-white/20" />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Doorli
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1d9e75]/20 text-[#5dcaa5] border border-[#5dcaa5]/30">
                    Live ERP
                  </span>
                </span>
              </div>
            </div>

            {/* Quick App Switcher & Auth Links */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/ride" 
                className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-[#122541] hover:bg-[#1a3457] text-white/80 transition"
              >
                <Car className="w-3.5 h-3.5 text-[#378add]" />
                Rides
              </Link>

              <a 
                href="/super-admin/login" 
                target="_blank" 
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition"
              >
                <Shield className="w-3.5 h-3.5 text-purple-300" />
                Operations admin
              </a>

              <a 
                href="/vendor/login" 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-300" />
                Vendor workspace
              </a>

              <button
                type="button"
                onClick={() => setMobilePreview(!mobilePreview)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mobilePreview ? "Desktop View" : "Mobile App View"}</span>
              </button>

              {loggedIn ? (
                <>
                  <Link href="/orders" className="text-xs font-medium text-white/80 hover:text-white px-2 py-1">
                    Orders
                  </Link>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-300 hover:text-red-200 px-2 py-1"
                    onClick={() => {
                      clearCustomerToken();
                      setLoggedIn(false);
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link href="/login" className="doorli-cta-primary text-xs sm:text-sm py-2 px-4">
                  Log In
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Body */}
        <div className={`relative z-20 flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 ${mobilePreview ? "max-w-md mx-auto" : ""}`}>
          <div className="max-w-4xl mx-auto w-full text-center">
            
            {/* Live Status Pill */}
            <div className="animate-bounce-in inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122541] border border-white/20 mb-6 text-xs sm:text-sm text-white/90 shadow-xl animate-pulse-glow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5dcaa5] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5dcaa5]"></span>
              </span>
              <span>Hyperlocal Neighborhood Network • ERP Connected</span>
              <Zap className="w-3.5 h-3.5 text-[#fac775]" />
            </div>

            <div className="flex flex-col items-center">
              {/* Logo with Glow */}
              <div className="relative group cursor-pointer animate-bounce-in" style={{ animationDelay: '0.1s' }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#185fa5] via-[#5dcaa5] to-[#fac775] rounded-[2rem] blur-xl opacity-60 group-hover:opacity-100 transition duration-700 animate-pulse" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MARK}
                  alt="Doorli"
                  className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[1.75rem] shadow-[0_24px_80px_rgba(0,0,0,0.6)] mb-6 ring-2 ring-white/20 object-cover animate-doorli-float"
                />
              </div>

              <h1 className="animate-slide-up font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg" style={{ animationDelay: '0.2s' }}>
                Doorli
              </h1>
              <p className="animate-slide-up font-display mt-3 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-[#b5d4f4] to-[#5dcaa5] bg-clip-text text-transparent animate-gradient" style={{ animationDelay: '0.3s' }}>
                Everything local. Delivered.
              </p>
              <p className="animate-slide-up mt-4 text-sm sm:text-base md:text-lg text-[#9bb4d0] max-w-xl mx-auto leading-relaxed" style={{ animationDelay: '0.4s' }}>
                Marketplace, food, hotels, halls, services, beauty, delivery & rides — one seamless app connected directly to merchant ERP behind the counter.
              </p>
            </div>

            {/* Universal Search Bar */}
            <div className="animate-slide-up max-w-2xl mx-auto mt-8 relative z-40" style={{ animationDelay: '0.5s' }}>
              <UniversalSearch />
            </div>

            {/* Quick Action Badges */}
            <div className="animate-slide-up mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3" style={{ animationDelay: '0.6s' }}>
              <Link href="/search?category=grocery" className="doorli-cta-ghost text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 hover:scale-105 transition-transform">
                <Store className="w-4 h-4 text-[#378add]" />
                Browse Marketplace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/search?category=restaurant" className="doorli-cta-ghost text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 hover:scale-105 transition-transform">
                <Utensils className="w-4 h-4 text-[#fac775]" />
                Order Food
              </Link>
              <Link href="/ride" className="doorli-cta-ghost text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 hover:scale-105 transition-transform">
                <Car className="w-4 h-4 text-[#5dcaa5]" />
                Book Ride
              </Link>
              <Link href="/ai-picks" className="doorli-cta-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5 hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-purple-200" />
                AI Smart Picks
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="animate-slide-up mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-white/10 text-xs text-[#9bb4d0]" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center justify-center gap-1.5 group hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4 text-[#5dcaa5] group-hover:animate-bounce" />
                <span>{vendorCount > 0 ? `${vendorCount}+ Verified Vendors` : "Verified Vendors"}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 group hover:scale-105 transition-transform">
                <Clock className="w-4 h-4 text-[#fac775] group-hover:animate-bounce" />
                <span>15-30 Min Delivery</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 group hover:scale-105 transition-transform">
                <Shield className="w-4 h-4 text-[#378add] group-hover:animate-bounce" />
                <span>Live ERP Sync</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 group hover:scale-105 transition-transform">
                <Star className="w-4 h-4 text-[#fac775] group-hover:animate-bounce" />
                <span>{avgRating}/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services & Marketplace Verticals Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-8 bg-[#040816] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5dcaa5] mb-2">
                <TrendingUp className="w-4 h-4" />
                Hyperlocal Ecosystem
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                LocalConnect Verticals
              </h2>
              <p className="mt-2 text-[#9bb4d0] text-sm sm:text-base max-w-xl">
                Every service, shop, hotel and ride is connected to merchant ERP in real-time.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All Services" },
                { id: "grocery", label: "Marketplace" },
                { id: "restaurant", label: "Dining" },
                { id: "hotel", label: "Stays & Venues" },
                { id: "rides", label: "Rides" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "bg-[#185fa5] text-white shadow-lg shadow-[#185fa5]/40"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredFeatures.map((f, index) => (
              <Link
                key={f.name}
                href={f.href}
                className="group relative p-6 rounded-3xl doorli-glass-card hover:border-[#378add]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${0.8 + (index * 0.1)}s` }}
              >
                {/* Glow Background */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${f.badgeColor} group-hover:scale-110 transition-transform`}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-white text-xl group-hover:text-[#5dcaa5] transition-colors flex items-center gap-2">
                    {f.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[#9bb4d0] leading-relaxed">{f.blurb}</p>
                </div>

                <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                  <span className="font-mono">{f.erp}</span>
                  <span className="font-semibold text-[#378add] group-hover:underline">Explore</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vendors Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-8 bg-[#02050e]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Nearby Verified Merchants
              </h2>
              <p className="mt-1.5 text-[#9bb4d0] text-sm">Shops, restaurants & service providers live in your area.</p>
            </div>
            <Link href="/search" className="text-xs sm:text-sm font-semibold text-[#5dcaa5] hover:underline flex items-center gap-1">
              View All Vendors
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {error && <p className="text-[var(--doorli-gold)] text-sm mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {vendors.map((v, index) => (
              <Link
                key={v.id}
                href={`/shop/${v.id}`}
                className="p-6 rounded-3xl doorli-glass-card hover:bg-white/[0.08] transition block group border border-white/10 animate-slide-up hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${1.5 + (index * 0.1)}s` }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#185fa5]/20 text-[#378add] border border-[#185fa5]/30 group-hover:scale-110 transition-transform">
                    {v.category}
                  </span>
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${v.isOpen !== false ? "text-emerald-400" : "text-rose-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.isOpen !== false ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    {v.isOpen !== false ? "Open Now" : "Closed"}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mt-4 group-hover:text-[#5dcaa5] transition-colors">
                  {v.businessName}
                </h3>
                <p className="text-[#9bb4d0] text-xs sm:text-sm mt-1.5 line-clamp-2">
                  {v.description || `${v.category} vendor located in ${v.city || "Colombo"}`}
                </p>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#fac775]" />
                    <span>{v.city || "Colombo"}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[#5dcaa5] group-hover:translate-x-1 transition-transform">
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}

            {loading && vendors.length === 0 && (
              <div className="col-span-full py-12 text-center text-white/40 font-mono text-sm">
                Loading live vendors from ERP database…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 md:px-8 bg-[#010309] border-t border-white/10 text-xs text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK} alt="" className="w-6 h-6 rounded-md opacity-80" />
            <span className="font-display font-bold text-white text-sm">Doorli</span>
            <span>© 2026 Doorli Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-white/60">
            <a href="/super-admin/login" target="_blank" rel="noreferrer" className="hover:text-white">Operations admin</a>
            <a href="/vendor/login" target="_blank" rel="noreferrer" className="hover:text-white">Vendor workspace</a>
            <Link href="/ride" className="hover:text-white">Ride App</Link>
            <Link href="/events" className="hover:text-white">Events</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
