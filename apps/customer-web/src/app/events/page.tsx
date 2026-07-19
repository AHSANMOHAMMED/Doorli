"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getCustomerToken } from "@/lib/api";

type EventPkg = {
  id: string;
  title: string;
  eventDate: string;
  guestCount?: number | null;
  status: string;
  totalEstimate?: number | string | null;
};

export default function EventsPage() {
  const [items, setItems] = useState<EventPkg[]>([]);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!getCustomerToken()) return;
    try {
      const data = await apiFetch<EventPkg[]>("/events/my");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/events");
      return;
    }
    queueMicrotask(() => {
      void load();
    });
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          eventDate: new Date(eventDate).toISOString(),
          guestCount,
          items: [
            { role: "venue", label: "Venue", estimatedCost: 50000 },
            { role: "catering", label: "Catering", estimatedCost: 80000 },
          ],
        }),
      });
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen doorli-hero-plane text-white px-5 py-10 pb-28">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold">Event planning</h1>
          <Link href="/" className="text-sm text-white/60">
            Home
          </Link>
        </div>
        <p className="text-[#9bb4d0]">Build a package — venue, catering, décor in one place.</p>

        <form onSubmit={create} className="doorli-glass rounded-2xl p-5 space-y-3">
          <input
            className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 min-h-11"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="date"
            className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 min-h-11"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
          <input
            type="number"
            className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 min-h-11"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            min={1}
          />
          {error && <p className="text-amber-200 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="w-full doorli-cta-primary justify-center min-h-12">
            {saving ? "Saving…" : "Create draft package"}
          </button>
        </form>

        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="doorli-glass rounded-2xl p-4">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-white/50 mt-1">
                {new Date(p.eventDate).toLocaleDateString()} · {p.guestCount ?? "—"} guests · {p.status}
              </p>
              {p.totalEstimate != null && (
                <p className="text-[var(--doorli-mint)] text-sm mt-2">Est. LKR {Number(p.totalEstimate).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
