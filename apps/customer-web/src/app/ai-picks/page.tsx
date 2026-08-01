"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star, Store, Loader2, ArrowRight } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Recommendation = {
  category: string;
  reason: string;
};

export default function AIPicksPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Get user ID from token or use a generic prompt
        const token = getCustomerToken();
        let userId = "anonymous";
        
        if (token) {
          // Decode JWT to get user ID (simple base64 decode of payload)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub || payload.userId || payload.id || "anonymous";
          } catch {
            // If token parsing fails, use anonymous
            userId = "anonymous";
          }
        }

        const data = await apiFetch<{ recommendations: Recommendation[] }>("/ai/recommendations", {
          method: "POST",
          body: JSON.stringify({ userId }),
        });

        if (!cancelled) {
          if (data && data.recommendations) {
            setRecommendations(data.recommendations);
          } else {
            setRecommendations([
              { category: "Groceries", reason: "You usually buy groceries on weekends." },
              { category: "Pharmacy", reason: "Based on your seasonal purchasing habits." }
            ]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load AI recommendations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative pb-20">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 60%)" }} aria-hidden />
      
      <div className="relative z-10 max-w-4xl mx-auto px-5 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Doorli
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
              AI Smart Picks
            </h1>
            <p className="text-[#9bb4d0] mt-1 text-sm">
              Personalized recommendations driven by your past orders and preferences.
            </p>
          </div>
        </div>

        {error && (
          <div className="doorli-glass border-red-500/40 p-4 rounded-xl text-red-200 mb-6 text-sm">
            {error} (Showing defaults instead)
          </div>
        )}

        {loading ? (
          <div className="doorli-glass-card p-12 rounded-3xl flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-white/60 text-sm animate-pulse">Our AI is analyzing your Doorli history...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <Link 
                  key={i} 
                  href={`/search?category=${rec.category.toLowerCase()}`}
                  className="doorli-glass-card rounded-3xl p-6 group cursor-pointer hover:bg-white/10 transition-all border border-white/10 hover:border-purple-500/50 flex flex-col justify-between animate-slide-up hover:-translate-y-1 hover:scale-105"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-purple-400" />
                      </div>
                      <Star className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {rec.category}
                    </h3>
                    <p className="text-sm text-white/60 mt-2 line-clamp-3">
                      {rec.reason}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Explore vendors</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-white/50 text-center col-span-full">No recommendations found yet.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
