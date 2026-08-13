"use client";

import { useEffect, useState } from "react";
import { superAdminFetch } from "@/lib/api";

type Diagnostic = { name: string; status: "ok" | "degraded" | "down"; latencyMs: number };
type Broadcast = { id: string; title: string; body: string; sentAt: string };

export default function SystemBroadcastsPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function load() {
    try {
      const [diagnosticResponse, broadcastResponse] = await Promise.all([
        superAdminFetch("/admin/diagnostics"),
        superAdminFetch("/admin/broadcasts"),
      ]);
      setDiagnostics(diagnosticResponse.data?.checks ?? []);
      setBroadcasts(broadcastResponse.data ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load system data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(interval);
  }, []);

  async function sendBroadcast() {
    if (!title.trim() || !body.trim()) {
      setResult("Enter a title and message before dispatching.");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const response = await superAdminFetch("/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), type: "admin_broadcast" }),
      });
      setResult(`Sent to ${response.count ?? "all"} users.`);
      setTitle("");
      setBody("");
      await load();
    } catch (cause) {
      setResult(cause instanceof Error ? cause.message : "Broadcast failed.");
    } finally {
      setSending(false);
    }
  }

  const healthy = diagnostics.filter((check) => check.status === "ok").length;
  const erp = diagnostics.find((check) => check.name.toLowerCase().includes("erp"));

  return (
    <main className="min-h-screen bg-[#121212] text-[#e5e2e1] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-secondary">Doorli Super Admin</p>
          <h1 className="text-4xl font-bold mt-2">System broadcasts</h1>
          <p className="text-on-surface-variant mt-2">Monitor platform health and send an operational message.</p>
        </header>

        {loading && <p className="text-on-surface-variant">Loading system data...</p>}
        {error && <p className="text-error">{error}</p>}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-xl"><p className="text-on-surface-variant">Healthy services</p><p className="text-3xl font-bold mt-3">{healthy}/{diagnostics.length}</p></div>
          <div className="glass-panel p-5 rounded-xl"><p className="text-on-surface-variant">API success rate</p><p className="text-3xl font-bold mt-3">{diagnostics.length ? Math.round((healthy / diagnostics.length) * 100) : 0}%</p></div>
          <div className="glass-panel p-5 rounded-xl"><p className="text-on-surface-variant">ERP latency</p><p className="text-3xl font-bold mt-3">{erp ? `${erp.latencyMs}ms` : "N/A"}</p></div>
        </section>

        <section className="glass-panel rounded-xl p-6 space-y-5">
          <h2 className="text-xl font-bold">Global broadcast composer</h2>
          <label className="block text-sm text-on-surface-variant">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-on-background" /></label>
          <label className="block text-sm text-on-surface-variant">Message<textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-2 w-full min-h-32 bg-surface-container-low border border-outline-variant rounded-xl p-3 text-on-background" /></label>
          {result && <p className="text-sm text-on-surface-variant">{result}</p>}
          <button type="button" onClick={() => void sendBroadcast()} disabled={sending} className="bg-primary text-on-primary rounded-xl px-5 py-3 font-bold disabled:opacity-50">{sending ? "Sending..." : "Dispatch now"}</button>
        </section>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="text-xl font-bold">Recent broadcasts</h2>
          <div className="mt-4 space-y-3">{broadcasts.map((broadcast) => <article key={broadcast.id} className="border-b border-outline-variant pb-3"><p className="font-semibold">{broadcast.title}</p><p className="text-sm text-on-surface-variant mt-1">{broadcast.body}</p><time className="text-xs text-on-surface-variant">{new Date(broadcast.sentAt).toLocaleString()}</time></article>)}{!broadcasts.length && <p className="text-sm text-on-surface-variant">No broadcasts yet.</p>}</div>
        </section>
      </div>
    </main>
  );
}
