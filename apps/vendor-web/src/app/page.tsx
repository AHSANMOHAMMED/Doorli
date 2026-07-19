'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Utensils, Wrench } from 'lucide-react';

const SELLER_TYPES = [
  {
    icon: ShoppingBag,
    name: 'Grocery & retail',
    description: 'Catalog, stock, and doorstep orders from neighbors nearby.',
  },
  {
    icon: Utensils,
    name: 'Restaurants & kitchens',
    description: 'Live tickets, kitchen board, and delivery handoff in one place.',
  },
  {
    icon: Wrench,
    name: 'Services & bookings',
    description: 'Appointments, halls, and on-demand jobs without spreadsheet chaos.',
  },
];

const MARK = '/vendor/brand/doorli-mark.svg';

export default function LandingPage() {
  return (
    <div className="doorli-public min-h-screen">
      <nav className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK} alt="" className="w-9 h-9 rounded-xl shadow-lg shadow-black/30" />
            <span className="font-display text-lg font-semibold tracking-tight text-white">Doorli</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm font-medium text-white/75 hover:text-white px-3 py-2 transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="doorli-cta-primary text-sm py-2.5 px-4 shadow-none">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden doorli-hero-plane">
        <div className="doorli-orb doorli-orb--a" aria-hidden />
        <div className="doorli-orb doorli-orb--b" aria-hidden />
        <div className="doorli-orb doorli-orb--c" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto w-full px-5 sm:px-8 pt-24 pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MARK}
              alt="Doorli"
              className="doorli-rise w-28 h-28 sm:w-36 sm:h-36 rounded-[1.75rem] shadow-2xl shadow-black/40 mb-8"
            />
            <h1 className="doorli-rise-delay font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]">
              Doorli
            </h1>
            <p className="doorli-rise-delay font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold text-white/90 mt-3 leading-snug max-w-xl">
              Sell next door. Grow on Doorli.
            </p>
            <p className="doorli-rise-delay-2 mt-5 text-base sm:text-lg text-[var(--doorli-text-muted)] max-w-lg leading-relaxed">
              Orders, bookings, and your kitchen board — built for local sellers who want neighbors at the door.
            </p>
            <div className="doorli-rise-delay-2 mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="doorli-cta-primary justify-center">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="doorli-cta-ghost justify-center">
                Sign In
              </Link>
            </div>
          </div>

          <div className="relative hidden sm:block doorli-rise-delay-2">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#185FA5]/40 via-transparent to-[#1D9E75]/30 blur-2xl" />
            <div className="relative doorli-glass rounded-[2rem] p-6 sm:p-8 min-h-[320px] flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#FAC775]/20 blur-3xl" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--doorli-mint)] font-medium">Vendor portal</p>
                <p className="font-display text-2xl font-semibold text-white mt-3 max-w-xs">
                  One board for tickets, stock, and the next delivery.
                </p>
              </div>
              <div className="mt-10 space-y-3">
                {['Live order queue', 'Kitchen display', 'Neighborhood reach'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/90"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--doorli-gold)]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#07101f] py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for local sellers
          </h2>
          <p className="mt-3 text-[var(--doorli-text-muted)] max-w-xl text-lg">
            Whether you stock shelves, plate meals, or book appointments — Doorli keeps the neighborhood flowing to you.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {SELLER_TYPES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="doorli-glass rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[var(--doorli-mint)] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 text-sm text-[var(--doorli-text-muted)] leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-14">
            <Link href="/login" className="doorli-cta-primary">
              Open vendor portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#050b18] py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK} alt="" className="w-7 h-7 rounded-lg" />
            <span className="font-display font-semibold text-white">Doorli</span>
          </div>
          <p className="text-sm text-white/40">© {new Date().getFullYear()} Doorli. Sell next door.</p>
        </div>
      </footer>
    </div>
  );
}
