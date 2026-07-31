"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Landmark, FileText, Settings, ShieldCheck, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

type GovService = {
  id: string;
  title: string;
  description: string;
  department: string;
};

export default function GovServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<GovService[]>([]);

  useEffect(() => {
    apiFetch<{ success: boolean; data: GovService[] }>("/gov/services")
      .then((res) => {
        if (res.success && res.data) setServices(res.data);
      })
      .catch(() => { /* keep empty state */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative pb-20">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      
      <div className="relative z-10 max-w-4xl mx-auto px-5 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Doorli
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center animate-pulse-glow">
            <Landmark className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
              E-Governance Portal
            </h1>
            <p className="text-[#9bb4d0] mt-1 text-sm">
              Access local municipal services, pay taxes, and file reports seamlessly.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="doorli-glass-card rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="doorli-glass-card rounded-2xl p-8 text-center text-white/60">
            No government services available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="doorli-glass-card rounded-2xl p-6 group cursor-pointer hover:bg-white/10 transition-all border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {service.department}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-white/30 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/60 mt-2 line-clamp-2">
                    {service.description}
                  </p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5" /> E-Service
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                    Proceed <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 doorli-glass p-6 rounded-3xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex shrink-0 items-center justify-center">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Need a custom permit?</h4>
            <p className="text-xs text-white/60 mt-1">If your requirement isn't listed above, you can file a general petition to the municipal council directly from here.</p>
          </div>
          <button className="doorli-cta-primary ml-auto text-sm shrink-0">
            File Petition
          </button>
        </div>
      </div>
    </main>
  );
}
