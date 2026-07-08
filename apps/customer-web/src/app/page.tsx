"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Store, Utensils, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalSearch } from "@/components/UniversalSearch";

const categories = [
  { name: "Grocery & Retail", icon: Store, color: "bg-blue-500/10 text-blue-500" },
  { name: "Food Delivery", icon: Utensils, color: "bg-orange-500/10 text-orange-500" },
  { name: "Home Services", icon: Wrench, color: "bg-purple-500/10 text-purple-500" },
  { name: "Emergency SOS", icon: ShieldAlert, color: "bg-red-500/10 text-red-500" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-neutral-950">
        <div className="absolute top-0 -left-1/4 h-full w-1/2 bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-lg">D</div>
            <span className="font-semibold text-xl tracking-tight">Doorli</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">Log In</button>
            <button className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-colors">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now live in your neighborhood
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter"
          >
            Everything Local. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Delivered instantly.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto"
          >
            Connect with every business, service, and venue in your community. One app for groceries, food, home repairs, and emergency alerts.
          </motion.p>

          {/* Search Bar - Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mt-8 flex justify-center z-50 relative"
          >
            <UniversalSearch />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-6 border-t border-white/5 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8">Explore Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.color)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-neutral-200 group-hover:text-white transition-colors">{cat.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
