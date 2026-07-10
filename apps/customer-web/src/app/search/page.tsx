"use client";

import { useSearchParams } from "next/navigation";
import { UniversalSearch } from "@/components/UniversalSearch";
import { Store, Package, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";

const MOCK_VENDORS = [
  { id: "1", name: "Joe's Pizza", type: "Food Delivery", rating: 4.8, reviews: 342, distance: "0.5 mi", time: "15-25 min", image: "🍕" },
  { id: "2", name: "Fresh Mart", type: "Grocery", rating: 4.6, reviews: 859, distance: "1.2 mi", time: "30-45 min", image: "🛒" },
  { id: "3", name: "City Hardware", type: "Retail", rating: 4.9, reviews: 124, distance: "2.1 mi", time: "Available Now", image: "🔨" }
];

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!query) return;
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:4004/api/search/products?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        // Fallback to empty if the search service is offline
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [query]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <UniversalSearch />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Search Results for "{query}"</h1>
        <p className="text-neutral-400 mb-8">Found {results.length} local vendors near you.</p>
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={`/vendor/${vendor.vendorId}`}>
                  <div className="group rounded-2xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors overflow-hidden cursor-pointer h-full flex flex-col">
                    <div className="h-40 bg-neutral-800 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                      {vendor.image_url ? (
                        <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover" />
                      ) : "📦"}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-semibold text-white">{vendor.name}</h2>
                        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                          <span className="text-sm font-medium">${vendor.price}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 mb-4">{vendor.vendorName} • {vendor.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <Store className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-neutral-300 mb-2">No items found</h3>
            <p className="text-neutral-500 max-w-md mx-auto">We couldn't find any products or vendors matching your search. Try adjusting your query.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
