'use client';

import Link from 'next/link';
import { ShoppingBag, Utensils, Hotel, Calendar, Wrench, Sparkles, ArrowRight, Store, Users, Truck, Search, PackageCheck, CircleCheck as CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  {
    icon: ShoppingBag,
    name: 'Grocery',
    description: 'Fresh produce and daily essentials delivered to your door',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Utensils,
    name: 'Restaurant',
    description: 'Order from your favorite local restaurants and kitchens',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Hotel,
    name: 'Hotel',
    description: 'Book rooms and stays from trusted local hotels',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Calendar,
    name: 'Hall',
    description: 'Reserve halls and venues for your special events',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Wrench,
    name: 'Service',
    description: 'On-demand home services from skilled professionals',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Sparkles,
    name: 'Beauty',
    description: 'Book beauty and salon appointments with ease',
    color: 'bg-pink-50 text-pink-600',
  },
];

const STATS = [
  { icon: Store, label: 'Vendors', value: '1000+' },
  { icon: Users, label: 'Customers', value: '50k+' },
  { icon: Truck, label: 'Deliveries', value: '100k+' },
];

const STEPS = [
  {
    icon: Search,
    title: 'Browse',
    description: 'Discover local vendors across grocery, food, hotels, services, and more — all in one app.',
  },
  {
    icon: ShoppingBag,
    title: 'Order',
    description: 'Place your order or booking in seconds. Pay securely and track everything in real time.',
  },
  {
    icon: PackageCheck,
    title: 'Receive',
    description: 'Get your items delivered to your door or your booking confirmed — fast, reliable, local.',
  },
];

const FOOTER_LINKS = [
  {
    title: 'Platform',
    links: [
      { label: 'Get Started', href: '/login' },
      { label: 'Sign In', href: '/login' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Grocery', href: '/login' },
      { label: 'Restaurant', href: '/login' },
      { label: 'Hotel', href: '/login' },
      { label: 'Beauty', href: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/login' },
      { label: 'Contact', href: '/login' },
      { label: 'Privacy', href: '/login' },
      { label: 'Terms', href: '/login' },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Doorli</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white/90 mb-6">
              <Sparkles className="w-4 h-4" />
              Your local marketplace, delivered
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Everything Local.
              <br />
              Delivered.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-50 max-w-2xl mx-auto">
              Doorli connects you with local vendors across grocery, restaurants,
              hotels, halls, services, and beauty — all in one place. Browse, order,
              and receive, fast.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="bg-white text-blue-600 px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2 shadow-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="bg-blue-700/40 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-semibold border border-white/30 hover:bg-blue-700/60 transition-colors inline-flex items-center gap-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="relative">
          <svg
            className="w-full h-12 sm:h-16 text-white"
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,48 L0,18 C240,0 480,0 720,18 C960,36 1200,36 1440,18 L1440,48 Z" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories / Features */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              One App. Six Categories.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Everything you need from your local community, all in a single platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="card p-6 hover:shadow-md transition-shadow group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{cat.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Three simple steps to get what you need, locally.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-slate-100"></div>
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg mb-6">
                    <Icon className="w-10 h-10" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-blue-600 text-sm font-bold flex items-center justify-center shadow">
                      {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-slate-500 max-w-xs mx-auto">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-sky-500 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-blue-50">
            Join thousands of customers and vendors on Doorli today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2 shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="bg-blue-700/40 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-semibold border border-white/30 hover:bg-blue-700/60 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Doorli</span>
              </div>
              <p className="text-sm text-slate-400">
                Everything Local. Delivered. Your community marketplace for goods,
                services, and bookings.
              </p>
            </div>
            {/* Link columns */}
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Doorli. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Trusted by local communities</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
