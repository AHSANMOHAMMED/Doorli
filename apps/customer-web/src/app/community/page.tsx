"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Flag, MessageCircle, Send } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Post = { id: string; type: string; content: string; locality: string; createdAt: string; user?: { fullName: string } };

export default function CommunityPage() {
  const [locality, setLocality] = useState("Colombo");
  const [type, setType] = useState("general");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try { const data = await apiFetch<{ items: Post[] }>(`/community/feed?locality=${encodeURIComponent(locality)}`); setPosts(data.items); } catch (cause) { setError(cause instanceof Error ? cause.message : "Community feed unavailable."); }
  }
  useEffect(() => { void load(); }, [locality]);

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!getCustomerToken()) { window.location.assign("/login?next=/community"); return; }
    try { await apiFetch<Post>("/community/posts", { method: "POST", body: JSON.stringify({ type, content, locality }) }); setContent(""); setMessage("Post published."); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to publish post."); }
  }

  return <main className="doorli-page-shell text-white"><div className="max-w-3xl mx-auto px-5 py-10 pb-28 space-y-6"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Doorli</Link><header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Neighbourhood layer</p><h1 className="font-display text-4xl font-bold mt-2">Community</h1><p className="text-white/60 mt-2">Share useful local information, recommendations, alerts, and events.</p></header><label className="block text-sm text-white/70">Neighbourhood<input value={locality} onChange={(e) => setLocality(e.target.value)} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" /></label><form onSubmit={publish} className="doorli-glass rounded-3xl p-6 space-y-3"><div className="flex gap-2"><select value={type} onChange={(e) => setType(e.target.value)} className="bg-[#101c35] border border-white/15 rounded-xl px-3 py-3 text-white"><option value="general">General</option><option value="recommendation">Recommendation</option><option value="lost_found">Lost and found</option><option value="giveaway">Giveaway</option><option value="safety_alert">Safety alert</option></select><span className="text-sm text-white/45 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Neighbours only</span></div><textarea value={content} onChange={(e) => setContent(e.target.value)} required minLength={3} maxLength={2000} placeholder="What is happening in your neighbourhood?" className="w-full min-h-24 bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" />{message && <p className="text-sm text-[var(--doorli-mint)]">{message}</p>}{error && <p className="text-sm text-amber-200">{error}</p>}<button className="doorli-cta-primary"><Send className="w-4 h-4" /> Publish</button></form><section className="space-y-3">{posts.map((post) => <article key={post.id} className={`doorli-glass rounded-2xl p-5 ${post.type === "safety_alert" ? "border-rose-400/60" : ""}`}><div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-wider text-[var(--doorli-mint)]">{post.type.replace("_", " ")}</span>{post.type === "safety_alert" ? <AlertTriangle className="w-4 h-4 text-rose-300" /> : <Flag className="w-4 h-4 text-white/25" />}</div><p className="mt-3 text-white/85 whitespace-pre-wrap">{post.content}</p><p className="mt-4 text-xs text-white/40">{post.user?.fullName || "Neighbour"} · {new Date(post.createdAt).toLocaleString()}</p></article>)}{!posts.length && <p className="text-sm text-white/45">No posts in this neighbourhood yet.</p>}</section></div></main>;
}
