"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bed, Star, MapPin, ShoppingCart } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type HotelVendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  pricePerNight?: number;
  rating?: number;
  totalRooms?: number;
  availableRooms?: number;
  images?: string[];
  amenities?: string[];
  isFeatured?: boolean;
  phone?: string | null;
  address?: string | null;
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });

  useEffect(() => {
    apiFetch<{ items: HotelVendor[] } | HotelVendor[]>('/vendors?category=hotel')
      .then((d) => {
        const items = Array.isArray(d) ? d : d?.items || [];
        setHotels(items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load hotels'))
      .finally(() => setLoading(false));
  }, []);

  const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))] as string[];

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hotel.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hotel.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
    const price = hotel.pricePerNight || 0;
    const matchesPrice = price >= priceRange.min && price <= priceRange.max;
    return matchesSearch && matchesCity && matchesPrice;
  });

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, string> = {
      'WiFi': '📶',
      'Parking': '🅿️',
      'Breakfast': '🍳',
      'Pool': '🏊',
      'Spa': '🧖',
      'Air Conditioning': '❄️',
      'TV': '📺',
      'Gym': '🏋️',
      'Beach Access': '🏖️',
      'Restaurant': '🍽️',
      'Garden': '🌳',
      'Heritage Decor': '🏛️'
    };
    return icons[amenity] || '✓';
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Hotels & Stays</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary">hotel</span>
            <span className="text-caption font-caption text-on-surface-variant">Live ERP Sync</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-md mb-lg animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">Search Hotels</label>
              <input
                type="text"
                placeholder="Search by name, city, or amenities..."
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
              <label className="block text-sm text-[#9bb4d0] mb-2">Price Range (LKR)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  className="w-1/2 bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 20000 }))}
                  className="w-1/2 bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            <p className="text-[#9bb4d0] mt-4">Loading hotels...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-xs text-surface-variant">Please try again later</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
            {filteredHotels.map((hotel, index) => (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.id}`}
                className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
              >
                <div className="relative h-48 bg-surface-variant rounded-lg mb-md">
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-surface-variant text-6xl">hotel</span>
                  </div>
                  {hotel.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-[#fac775] text-[#121212] text-xs font-bold rounded-full">
                        FEATURED
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-[#185fa5]/80 text-white text-xs rounded-full">
                      {hotel.city}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {hotel.businessName}
                  </h3>

                  <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#fac775]" />
                      <span>{hotel.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#378add]" />
                      <span>{hotel.city}</span>
                    </div>
                    {hotel.availableRooms != null && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4 text-[#5dcaa5]" />
                        <span>{hotel.availableRooms} Rooms Available</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                    {hotel.description || `${hotel.businessName} - Hotel accommodation`}
                  </p>

                  {(hotel.amenities || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hotel.amenities!.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          {getAmenityIcon(amenity)} {amenity}
                        </span>
                      ))}
                      {hotel.amenities!.length > 4 && (
                        <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          +{hotel.amenities!.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-md pt-md border-t border-surface-variant">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#9bb4d0] uppercase tracking-wider">Starting from</div>
                      <div className="font-display text-lg font-bold text-[#5dcaa5]">
                        Rs. {(hotel.pricePerNight || 0).toLocaleString()}<span className="text-xs font-normal text-[#9bb4d0]">/night</span>
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

        {!loading && !error && filteredHotels.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No hotels found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
