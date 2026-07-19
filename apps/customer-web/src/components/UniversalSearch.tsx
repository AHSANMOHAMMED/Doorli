"use client";

import { useState, useEffect, FormEvent } from "react";
import { Search, MapPin, Loader2, Store, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBase } from "@/lib/api";

interface SearchResult {
  id: string;
  type: "business" | "product";
  name: string;
  description: string;
  distance?: string;
  price?: string;
  vendorId?: string;
}

export function UniversalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const [vendorsData, searchRes] = await Promise.all([
          apiFetch<{ items: Array<{ id: string; businessName: string; description?: string | null; category: string }> }>(
            "/vendors",
          ),
          fetch(`${getApiBase()}/api/v1/search/products?q=${encodeURIComponent(query.trim())}`).then((r) =>
            r.json().catch(() => ({ results: [] })),
          ),
        ]);

        const q = query.toLowerCase();
        const vendorHits: SearchResult[] = (vendorsData.items || [])
          .filter(
            (v) =>
              v.businessName.toLowerCase().includes(q) ||
              (v.description || "").toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((v) => ({
            id: v.id,
            type: "business" as const,
            name: v.businessName,
            description: v.description || v.category,
          }));

        const productHits: SearchResult[] = (searchRes.results || []).slice(0, 5).map(
          (p: { id?: string; name?: string; vendorName?: string; vendorId?: string; price?: number }, i: number) => ({
            id: p.id || `p-${i}`,
            type: "product" as const,
            name: p.name || "Product",
            description: p.vendorName || "",
            price: p.price != null ? `LKR ${p.price}` : undefined,
            vendorId: p.vendorId,
          }),
        );

        setResults([...vendorHits, ...productHits]);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-[#185FA5] to-[#1D9E75] rounded-2xl blur opacity-30 transition duration-500" />
      <div className="relative flex flex-col doorli-glass rounded-2xl shadow-2xl z-50">
        <form onSubmit={handleSearch} className="flex items-center p-2">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search vendors or products…"
              className="w-full bg-transparent border-none text-white placeholder:text-white/40 focus:outline-none px-4 py-3 text-lg"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            {isSearching && <Loader2 className="w-5 h-5 animate-spin text-[var(--doorli-mint)]" />}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 border-l border-white/10">
            <MapPin className="w-4 h-4 text-white/45" />
            <span className="text-sm text-white/70">Colombo</span>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#185FA5] hover:bg-[#1470c4] text-white rounded-xl font-medium transition-colors"
          >
            Search
          </button>
        </form>

        <AnimatePresence>
          {isOpen && query.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full mt-2 doorli-glass rounded-2xl shadow-2xl overflow-hidden"
            >
              {results.length > 0 ? (
                <ul className="max-h-96 overflow-y-auto p-2">
                  {results.map((item) => (
                    <li
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (item.type === "business") router.push(`/shop/${item.id}`);
                        else if (item.vendorId) router.push(`/shop/${item.vendorId}`);
                        else router.push(`/search?q=${encodeURIComponent(item.name)}`);
                      }}
                      className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-start gap-4"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          item.type === "business"
                            ? "bg-[#185FA5]/25 text-[#B5D4F4]"
                            : "bg-[#1D9E75]/25 text-[var(--doorli-mint)]",
                        )}
                      >
                        {item.type === "business" ? (
                          <Store className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <span className="text-xs text-neutral-400">{item.price}</span>
                        </div>
                        <p className="text-sm text-neutral-400 truncate">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !isSearching && (
                  <div className="p-8 text-center text-neutral-400">No results for “{query}”.</div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
