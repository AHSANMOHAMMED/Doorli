"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Users, Clock, ArrowLeft, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Forum = {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount?: number;
  postCount?: number;
  lastActivity?: string;
};

const CATEGORIES = [
  { name: "General", icon: "💬", color: "from-blue-500/20 to-cyan-500/20" },
  { name: "Events", icon: "🎉", color: "from-purple-500/20 to-pink-500/20" },
  { name: "Services", icon: "🔧", color: "from-amber-500/20 to-orange-500/20" },
  { name: "Marketplace", icon: "🛒", color: "from-emerald-500/20 to-teal-500/20" },
];

export default function ForumsPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    apiFetch<{ items: Forum[] }>("/forums")
      .then((data) => setForums(data.items || []))
      .catch(() => setForums([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredForums = activeCategory === "All" 
    ? forums 
    : forums.filter(f => f.category === activeCategory);

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      <div className="relative z-10 max-w-5xl mx-auto px-5 py-10 pb-28">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Doorli
            </Link>
            <h1 className="font-display text-4xl font-bold">Community Forums</h1>
            <p className="text-[#9bb4d0] mt-2">Connect with neighbors, share experiences, and stay informed.</p>
          </div>
          <button className="doorli-cta-primary text-sm py-2.5 px-4">
            <Plus className="w-4 h-4" />
            New Topic
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm transition-all ${
              activeCategory === "All" 
                ? "bg-white text-[#0a0f2e] font-semibold" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm transition-all flex items-center gap-2 ${
                activeCategory === cat.name 
                  ? "bg-white text-[#0a0f2e] font-semibold" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#378add]" />
            <p className="text-white/50 mt-4">Loading forums...</p>
          </div>
        ) : filteredForums.length === 0 ? (
          <div className="doorli-glass rounded-3xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No forums yet</h3>
            <p className="text-white/50 mb-6">Be the first to start a conversation in your community.</p>
            <button className="doorli-cta-primary">
              <Plus className="w-4 h-4" />
              Create Forum
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredForums.map((forum) => {
              const catInfo = CATEGORIES.find(c => c.name === forum.category) || CATEGORIES[0];
              return (
                <Link
                  key={forum.id}
                  href={`/forums/${forum.id}`}
                  className="doorli-glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{catInfo.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold group-hover:text-[var(--doorli-mint)] transition-colors">
                          {forum.name}
                        </h3>
                        <p className="text-sm text-white/50 mt-1">{forum.category}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">{forum.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {forum.memberCount || 0} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {forum.postCount || 0} posts
                    </span>
                    {forum.lastActivity && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(forum.lastActivity).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
