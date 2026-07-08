"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, Store, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "business" | "product";
  name: string;
  description: string;
  distance?: string;
  price?: string;
}

export function UniversalSearch() {
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
        // In a real app, this points to our Elasticsearch-backed API
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 transition duration-500"></div>
      
      <div className="relative flex flex-col bg-neutral-900/80 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl z-50">
        <div className="flex items-center p-2">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="What do you need today? (Try 'pizza' or 'plumber')" 
              className="w-full bg-transparent border-none text-white placeholder:text-neutral-500 focus:outline-none px-4 py-3 text-lg"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
            {isSearching && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 border-l border-white/10">
            <MapPin className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">Current Location</span>
          </div>
          <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25">
            Search
          </button>
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {isOpen && query.length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {results.length > 0 ? (
                <ul className="max-h-96 overflow-y-auto p-2">
                  {results.map((item) => (
                    <li key={item.id} className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-start gap-4 transition-colors">
                      <div className={cn("p-2 rounded-lg", item.type === 'business' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400')}>
                        {item.type === 'business' ? <Store className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <span className="text-xs text-neutral-400">{item.distance || item.price}</span>
                        </div>
                        <p className="text-sm text-neutral-400 truncate">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !isSearching && (
                  <div className="p-8 text-center text-neutral-400">
                    No local results found for "{query}".
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Invisible backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
