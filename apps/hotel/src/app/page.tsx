"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Bed, Star, MapPin, Calendar, Search, Filter, Wifi, Car, Coffee, Waves, Loader2 } from 'lucide-react';

const getAmenityIcon = (amenity: string) => {
  if (amenity.includes('WiFi')) return <Wifi className="w-4 h-4" />;
  if (amenity.includes('Parking')) return <Car className="w-4 h-4" />;
  if (amenity.includes('Breakfast') || amenity.includes('Restaurant')) return <Coffee className="w-4 h-4" />;
  if (amenity.includes('Pool') || amenity.includes('Beach')) return <Waves className="w-4 h-4" />;
  return <span className="w-4 h-4 flex items-center justify-center text-xs">✓</span>;
};

export default function HotelHomePage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await fetch('/api/v1/vendors?category=hotel');
        if (!res.ok) throw new Error('Failed to fetch hotels');
        const data = await res.json();
        setHotels(data.data || data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const cities = useMemo(() => {
    const citySet = new Set(hotels.map((h: any) => h.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [hotels]);

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
    const matchesPrice = hotel.pricePerNight >= priceRange.min && hotel.pricePerNight <= priceRange.max;
    return matchesSearch && matchesCity && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-[#0a0f2e] text-white">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-white/10 bg-[#0a0f2e]/95 backdrop-blur-xl z-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#5dcaa5]">Doorli</span>
            <span className="text-sm text-[#7b8ba3]">Hotels</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/bookings" className="text-sm text-[#7b8ba3] hover:text-white transition-colors">
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5dcaa5]/10 to-transparent" />
        <div className="relative max-w-screen-xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-[#7b8ba3] bg-clip-text text-transparent">
            Find Your Perfect Stay
          </h1>
          <p className="text-lg text-[#7b8ba3] mb-8 max-w-2xl">
            Book hotels, guesthouses, and holiday villas directly from local owners. Best prices guaranteed.
          </p>

          {/* Search Box */}
          <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#7b8ba3] mb-2">Destination</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7b8ba3]" />
                  <input
                    type="text"
                    placeholder="Search by hotel name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white placeholder-[#7b8ba3] focus:border-[#5dcaa5] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                >
                  <option value="all">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Min Price (LKR/night)</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white placeholder-[#7b8ba3] focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Max Price (LKR/night)</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 20000 }))}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white placeholder-[#7b8ba3] focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotels Grid */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[#5dcaa5] animate-spin mb-4" />
            <p className="text-[#7b8ba3]">Loading hotels...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-400 mb-2">{error}</div>
            <button onClick={() => window.location.reload()} className="text-sm text-[#5dcaa5] hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Available Hotels</h2>
          <span className="text-[#7b8ba3]">{filteredHotels.length} hotels found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel, index) => (
            <Link
              key={hotel.id}
              href={`/hotel/${hotel.id}`}
              className="group relative bg-[#121a36] rounded-2xl border border-white/10 overflow-hidden hover:border-[#5dcaa5]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hotel Image */}
              <div className="relative h-48 bg-[#0a0f2e]">
                <div className="flex items-center justify-center h-full">
                  <Bed className="w-12 h-12 text-[#1a2340]" />
                </div>
                {hotel.isFeatured && (
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-[#fac775] text-[#0a0f2e] text-xs font-bold rounded-full">
                      FEATURED
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="px-3 py-1 bg-[#5dcaa5]/90 text-white text-xs rounded-full font-medium">
                    {hotel.city}
                  </span>
                </div>
              </div>

              {/* Hotel Info */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#5dcaa5] transition-colors">
                  {hotel.businessName}
                </h3>

                <div className="flex items-center gap-4 mb-3 text-sm text-[#7b8ba3]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#fac775]" />
                    <span>{hotel.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#378add]" />
                    <span>{hotel.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4 text-[#5dcaa5]" />
                    <span>{hotel.availableRooms} rooms</span>
                  </div>
                </div>

                <p className="text-sm text-[#7b8ba3] mb-4 line-clamp-2">
                  {hotel.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(hotel.amenities as string[]).slice(0, 4).map((amenity: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#0a0f2e] px-2 py-1 rounded text-[#7b8ba3]">
                      {getAmenityIcon(amenity)}
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span className="text-xs bg-[#0a0f2e] px-2 py-1 rounded text-[#7b8ba3]">
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>

                {/* Price and Book */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#7b8ba3] uppercase tracking-wider">Starting from</div>
                      <div className="text-xl font-bold text-[#5dcaa5]">
                        Rs. {hotel.pricePerNight.toLocaleString()}
                        <span className="text-xs font-normal text-[#7b8ba3]">/night</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#5dcaa5] text-[#0a0f2e] rounded-lg font-semibold text-sm hover:bg-[#4db894] transition-colors flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-16">
            <div className="text-[#7b8ba3] mb-2">No hotels found matching your criteria</div>
            <div className="text-sm text-[#5a6a80]">Try adjusting your search or filters</div>
          </div>
        )}
        </>
        )}
      </section>
    </div>
  );
}
