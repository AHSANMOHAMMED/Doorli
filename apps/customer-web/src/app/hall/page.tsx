"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Star, MapPin, ShoppingCart } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type HallVendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  basePrice?: number;
  rating?: number;
  capacity?: { min?: number; max?: number } | null;
  images?: string[];
  amenities?: string[];
  isFeatured?: boolean;
  phone?: string | null;
  address?: string | null;
};

export default function HallsPage() {
  const [halls, setHalls] = useState<HallVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [eventType, setEventType] = useState('all');

  async function loadHalls() {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch<{ items: HallVendor[] } | HallVendor[]>('/vendors?category=hall');
      const items = Array.isArray(d) ? d : d?.items || [];
      setHalls(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load halls');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHalls();
  }, []);

  const cities = [...new Set(halls.map(h => h.city).filter(Boolean))] as string[];

  const filteredHalls = halls.filter(hall => {
    const matchesSearch = hall.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hall.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hall.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || hall.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Halls & Event Venues</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary">calendar_today</span>
            <span className="text-caption font-caption text-on-surface-variant">Live ERP Sync</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-md mb-lg animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">Search Venues</label>
              <input
                type="text"
                placeholder="Search halls by name, city, or event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Events</option>
                <option value="wedding">Wedding</option>
                <option value="conference">Conference</option>
                <option value="party">Party</option>
                <option value="social">Social Event</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            <p className="text-[#9bb4d0] mt-4">Loading venues...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button type="button" onClick={() => void loadHalls()} className="doorli-cta-primary mt-3 px-4 py-2 text-sm">Try again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
            {filteredHalls.map((hall, index) => (
              <Link
                key={hall.id}
                href={`/hall/${hall.id}`}
                className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-tertiary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
              >
                <div className="relative h-48 bg-surface-variant rounded-lg mb-md">
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-surface-variant text-6xl">calendar_today</span>
                  </div>
                  {hall.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-[#fac775] text-[#121212] text-xs font-bold rounded-full">
                        FEATURED
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-[#185fa5]/80 text-white text-xs rounded-full">
                      {hall.city}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-tertiary transition-colors">
                    {hall.businessName}
                  </h3>

                  <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#fac775]" />
                      <span>{hall.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#378add]" />
                      <span>{hall.city}</span>
                    </div>
                    {hall.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#5dcaa5]" />
                        <span>{hall.capacity.min || 0}-{hall.capacity.max || 0} Guests</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                    {hall.description || `${hall.businessName} - Event venue`}
                  </p>

                  {(hall.amenities || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hall.amenities!.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          {amenity}
                        </span>
                      ))}
                      {hall.amenities!.length > 4 && (
                        <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          +{hall.amenities!.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-md pt-md border-t border-surface-variant">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bb4d0] uppercase tracking-wider">Starting from</div>
                      <div className="font-display text-lg font-bold text-[#fac775]">
                        Rs. {(hall.basePrice || 0).toLocaleString()}<span className="text-xs font-normal text-[#9bb4d0]">/day</span>
                      </div>
                    </div>
                    <button
                      className="doorli-cta-primary px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Book Now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && filteredHalls.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No venues found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
