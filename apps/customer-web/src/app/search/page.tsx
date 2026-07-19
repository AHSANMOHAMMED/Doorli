"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, getApiBase } from "@/lib/api";

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
};

type SearchHit = {
  id?: string;
  name?: string;
  vendorId?: string;
  vendorName?: string;
  price?: number;
};

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const path = category ? `/vendors?category=${encodeURIComponent(category)}` : "/vendors";
    apiFetch<{ items: Vendor[] }>(path)
      .then((d) => setVendors(d.items || []))
      .catch((e) => setError(e.message));
  }, [category]);

  useEffect(() => {
    if (!q) {
      setHits([]);
      return;
    }
    fetch(`${getApiBase()}/api/v1/search/products?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((json) => setHits(json.results || []))
      .catch(() => setHits([]));
  }, [q]);

  const filtered = useMemo(() => {
    if (!q) return vendors;
    const lower = q.toLowerCase();
    return vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(lower) ||
        (v.description || "").toLowerCase().includes(lower),
    );
  }, [vendors, q]);

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="text-neutral-400 hover:text-white text-sm">
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Search</h1>
      <p className="text-neutral-400 mb-8">
        {q ? `Results for “${q}”` : category ? `Category: ${category}` : "All vendors"}
      </p>
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      {hits.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          <div className="space-y-3">
            {hits.map((h, i) => (
              <Link
                key={`${h.id}-${i}`}
                href={h.vendorId ? `/shop/${h.vendorId}` : "/"}
                className="block p-4 rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <p className="font-medium">{h.name}</p>
                <p className="text-sm text-neutral-400">
                  {h.vendorName}
                  {h.price != null ? ` · LKR ${h.price}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Vendors</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((v) => (
          <Link
            key={v.id}
            href={`/shop/${v.id}`}
            className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
          >
            <p className="text-xs text-indigo-300 uppercase mb-1">{v.category}</p>
            <h3 className="text-xl font-semibold">{v.businessName}</h3>
            <p className="text-sm text-neutral-400 mt-2">{v.description || v.city}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white pt-20 px-6 pb-20">
      <Suspense fallback={<p>Loading search…</p>}>
        <SearchInner />
      </Suspense>
    </main>
  );
}
