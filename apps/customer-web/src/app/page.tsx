"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Car,
  ChevronDown,
  Clock3,
  ConciergeBell,
  MapPin,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Utensils,
  Wrench,
  Sun,
} from "lucide-react";
import { UniversalSearch } from "@/components/UniversalSearch";
import { apiFetch, clearCustomerToken, getCustomerToken } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

const MARK = "/brand/doorli-mark.svg";

const PILLARS = [
  { label: "Food & groceries", detail: "15-30 min delivery", href: "/search?category=restaurant", icon: Utensils, tone: "coral" },
  { label: "Local services", detail: "Book trusted pros", href: "/search?category=service", icon: Wrench, tone: "blue" },
  { label: "Rides & mobility", detail: "Go anywhere nearby", href: "/ride", icon: Car, tone: "green" },
] as const;

const QUICK_ACTIONS = [
  { label: "Food", href: "/search?category=restaurant", icon: Utensils, tone: "coral" },
  { label: "Groceries", href: "/search?category=grocery", icon: Store, tone: "blue" },
  { label: "Ride", href: "/ride", icon: Car, tone: "green" },
  { label: "Home fix", href: "/search?category=service", icon: Wrench, tone: "purple" },
  { label: "Bookings", href: "/events", icon: CalendarDays, tone: "gold" },
  { label: "Stays", href: "/hotel", icon: ConciergeBell, tone: "teal" },
] as const;

const INTENTS = [
  { id: "all", label: "Everything", icon: Sparkles },
  { id: "food", label: "Food", icon: Utensils },
  { id: "mart", label: "Mart", icon: Store },
  { id: "ride", label: "Ride", icon: Car },
  { id: "services", label: "Services", icon: Wrench },
] as const;

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  isOpen?: boolean;
};

function toneClass(tone: string) {
  return {
    coral: "bg-[#fff1ed] text-[#d65f45]",
    blue: "bg-[#edf5ff] text-[#2674c5]",
    green: "bg-[#eaf8f2] text-[#16805b]",
    purple: "bg-[#f3efff] text-[#7655cf]",
    gold: "bg-[#fff7df] text-[#a97812]",
    teal: "bg-[#e9f9f8] text-[#137f86]",
  }[tone] || "bg-[#edf5ff] text-[#2674c5]";
}

function categoryLabel(category: string) {
  return category.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MerchantCard({ vendor, index }: { vendor: Vendor; index: number }) {
  const tones = ["blue", "coral", "green", "purple"];
  const tone = tones[index % tones.length];
  const isOpen = vendor.isOpen !== false;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: .25, delay: index * .04 }} whileHover={{ y: -5 }} whileTap={{ scale: .985 }}>
    <Link href={`/shop/${vendor.id}`} className="merchant-card group">
      <div className={`merchant-cover merchant-cover-${tone}`}>
        <span className="merchant-category">{categoryLabel(vendor.category)}</span>
        <span className={isOpen ? "merchant-status merchant-status-open" : "merchant-status merchant-status-closed"}>
          {isOpen ? "Open now" : "Closed"}
        </span>
        <div className="merchant-cover-icon"><Store aria-hidden="true" /></div>
      </div>
      <div className="merchant-card-body">
        <div className="flex items-start justify-between gap-3">
          <h3 className="merchant-name">{vendor.businessName}</h3>
          <BadgeCheck className="h-5 w-5 shrink-0 text-[#16805b]" aria-label="Verified business" />
        </div>
        <div className="merchant-meta"><span className="merchant-rating">★ 4.8</span><span>(120+)</span><span>•</span><span>{vendor.city || "Colombo"}</span></div>
        <p className="merchant-description">{vendor.description || `${categoryLabel(vendor.category)} near you`}</p>
        <div className="merchant-footer"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> 15-25 min</span><span className="merchant-link">View <ArrowRight className="h-4 w-4" /></span></div>
      </div>
    </Link>
    </motion.div>
  );
}

function IntentSelector({ selected, onChange }: { selected: string; onChange: (intent: string) => void }) {
  return <div className="intent-switcher" role="tablist" aria-label="Choose what you need">
    {INTENTS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={selected === id} className={`intent-pill ${selected === id ? "is-active" : ""}`} onClick={() => onChange(id)}>
      {selected === id && <motion.span layoutId="intent-active" className="intent-active-bg" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
      <Icon /><span>{label}</span>
    </button>)}
  </div>;
}

function MerchantSkeleton() {
  return <div className="merchant-card merchant-skeleton"><div className="h-36 animate-pulse bg-[#e8eef5]" /><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-[#e8eef5]" /><div className="h-4 w-1/2 animate-pulse rounded bg-[#e8eef5]" /><div className="h-4 w-full animate-pulse rounded bg-[#e8eef5]" /></div></div>;
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(() => !!getCustomerToken());
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const { totalItems } = useCart();

  const visibleVendors = useMemo(() => {
    if (intent === "all") return vendors;
    const matches: Record<string, string[]> = { food: ["restaurant", "food"], mart: ["grocery", "mart"], services: ["service", "beauty", "hall", "hotel"], ride: ["ride", "rides", "delivery"] };
    return vendors.filter((vendor) => matches[intent]?.some((value) => vendor.category.toLowerCase().includes(value)));
  }, [intent, vendors]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ items: Vendor[] } | Vendor[]>("/vendors");
        const items = Array.isArray(data) ? data : data?.items || [];
        if (!cancelled) setVendors(items.slice(0, 6));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We could not load nearby businesses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className={`doorli-marketplace min-h-screen bg-[#f7fafc] text-[#10213f] ${darkMode ? "is-dark" : ""}`}>
      <header className="consumer-header">
        <div className="consumer-header-inner">
          <Link href="/" className="consumer-brand" aria-label="Doorli home">
            <img src={MARK} alt="" className="consumer-brand-mark" />
            <span>Doorli</span>
          </Link>
          <button className="location-selector" type="button"><MapPin className="h-4 w-4 text-[#16805b]" /><span className="hidden sm:inline">Deliver to</span><strong>Colombo</strong><ChevronDown className="h-4 w-4" /></button>
          <div className="consumer-search desktop-search"><UniversalSearch /></div>
          <nav className="consumer-actions" aria-label="Account navigation">
            <Link href="/orders" className="header-icon-button" aria-label="Orders"><ShoppingBag /><span className="hidden xl:inline">Orders</span></Link>
            <button className="header-icon-button hidden md:flex" type="button" aria-label="Notifications"><Bell /></button>
            <button className="header-icon-button hidden lg:flex" type="button" aria-label={darkMode ? "Use light theme" : "Use dark theme"} onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun /> : <Moon />}</button>
            {loggedIn ? <button className="profile-button" type="button" onClick={() => { clearCustomerToken(); setLoggedIn(false); }}><UserRound /><span className="hidden xl:inline">Log out</span></button> : <Link href="/login" className="primary-button header-login">Log in</Link>}
          </nav>
          <Link href="/checkout" className="mobile-cart" aria-label={`Cart, ${totalItems} items`}><ShoppingBag /><span>{totalItems}</span></Link>
        </div>
        <div className="mobile-search"><UniversalSearch /></div>
      </header>

      <section className="consumer-hero">
        <div className="consumer-hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Local businesses, one simple place</span>
          <h1>Everything local,<br /><span>delivered in minutes.</span></h1>
          <p>Discover trusted food, groceries, services, and rides near you. Doorli makes everyday life easier.</p>
          <div className="hero-actions"><Link href="/search?category=restaurant" className="primary-button"><motion.span whileTap={{ scale: .97 }}>Explore nearby <ArrowRight /></motion.span></Link><Link href="/ride" className="secondary-button">Book a ride</Link></div>
          <IntentSelector selected={intent} onChange={setIntent} />
        </div>
        <motion.div className="hero-visual" aria-label="Doorli local services preview" animate={{ y: [0, -7, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="hero-map-grid" />
          <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
          <div className="hero-phone-card"><div className="hero-phone-top"><span>Good morning</span><MapPin /></div><strong>What do you need today?</strong><div className="hero-phone-list"><span className="bg-[#fff1ed] text-[#d65f45]"><Utensils /></span><span>Food & groceries</span><ArrowRight /></div><div className="hero-phone-list"><span className="bg-[#eaf8f2] text-[#16805b]"><Car /></span><span>Rides nearby</span><ArrowRight /></div><div className="hero-phone-list"><span className="bg-[#edf5ff] text-[#2674c5]"><Wrench /></span><span>Local services</span><ArrowRight /></div></div>
        </motion.div>
      </section>

      <section className="pillar-section page-width"><div className="section-heading"><div><span className="section-kicker">Start with what you need</span><h2>One app for your everyday</h2></div><Link href="/search" className="section-link">See everything <ArrowRight /></Link></div><div className="pillar-grid">{PILLARS.map(({ label, detail, href, icon: Icon, tone }) => <Link key={label} href={href} className="pillar-card"><span className={`pillar-icon ${toneClass(tone)}`}><Icon /></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight className="pillar-arrow" /></Link>)}</div></section>

      <section className="quick-section page-width"><div className="section-heading"><div><span className="section-kicker">Quick access</span><h2>What are you looking for?</h2></div></div><div className="quick-grid">{QUICK_ACTIONS.map(({ label, href, icon: Icon, tone }) => <Link href={href} key={label} className="quick-action"><span className={`quick-icon ${toneClass(tone)}`}><Icon /></span><span>{label}</span></Link>)}</div></section>

      <section className="feed-section page-width"><div className="section-heading"><div><span className="section-kicker">{intent === "all" ? "Fast near you" : `${INTENTS.find((item) => item.id === intent)?.label} near you`}</span><h2>{intent === "ride" ? "Move around with Doorli" : "Popular places near you"}</h2><p>Real businesses, clear ETAs, and no confusing status labels.</p></div><Link href="/search?category=grocery" className="section-link">Browse all <ArrowRight /></Link></div>{error && <p className="inline-error">{error}</p>}<AnimatePresence mode="popLayout"><div className="merchant-grid">{loading ? [0, 1, 2].map((item) => <MerchantSkeleton key={item} />) : visibleVendors.length ? visibleVendors.map((vendor, index) => <MerchantCard key={vendor.id} vendor={vendor} index={index} />) : <div className="empty-feed"><Store /><p>No {intent} options nearby yet.</p><Link href="/search" className="section-link">Explore marketplace <ArrowRight /></Link></div>}</div></AnimatePresence></section>

      <section className="trust-strip"><div className="page-width trust-grid"><div><BadgeCheck /><strong>Verified local partners</strong><span>Businesses you can trust</span></div><div><Clock3 /><strong>Clear delivery times</strong><span>Know before you order</span></div><div><Truck /><strong>Live order updates</strong><span>From door to doorstep</span></div><div><Sparkles /><strong>One simple experience</strong><span>Less searching, more doing</span></div></div></section>

      <footer className="consumer-footer"><div className="page-width footer-inner"><div><Link href="/" className="consumer-brand"><img src={MARK} alt="" className="consumer-brand-mark" /><span>Doorli</span></Link><p>Everything local, close to home.</p></div><div className="footer-links"><Link href="/about">About Doorli</Link><Link href="/help">Help centre</Link><Link href="/vendor/login">Partner / Business</Link><Link href="/super-admin/login">Operations portal</Link></div><span className="footer-copy">© 2026 Doorli</span></div></footer>
    </main>
  );
}
