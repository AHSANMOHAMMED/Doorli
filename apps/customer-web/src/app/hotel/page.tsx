"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Bed, Star, MapPin, ShoppingCart } from 'lucide-react';

// Sample hotel data (this will be replaced with real API calls)
const hotels = [
  {
    id: 'hotel-001',
    businessName: 'Grand Hotel Colombo',
    category: 'hotel',
    description: 'Luxury 5-star hotel with spa and pool',
    city: 'Colombo',
    pricePerNight: 8500,
    rating: 4.7,
    totalRooms: 120,
    availableRooms: 15,
    images: ['/images/hotel1.jpg', '/images/hotel2.jpg'],
    amenities: ['Free WiFi', 'Parking', 'Breakfast', 'Pool', 'Spa', 'Air Conditioning', 'TV', 'Gym'],
    isFeatured: true,
    phone: '+94 11 123 4567',
    address: '123 Galle Road, Colombo'
  },
  {
    id: 'hotel-002',
    businessName: 'Beach Resort Negombo',
    category: 'hotel',
    description: 'Beachfront resort perfect for families',
    city: 'Negombo',
    pricePerNight: 4500,
    rating: 4.3,
    totalRooms: 85,
    availableRooms: 8,
    images: ['/images/hotel3.jpg'],
    amenities: ['Free WiFi', 'Parking', 'Beach Access', 'Swimming Pool', 'Restaurant'],
    isFeatured: false,
    phone: '+94 31 234 5678',
    address: 'Beach Road, Negombo'
  },
  {
    id: 'hotel-003',
    businessName: 'Heritage Boutique Kandy',
    category: 'hotel',
    description: 'Historic boutique hotel in Kandy',
    city: 'Kandy',
    pricePerNight: 3500,
    rating: 4.9,
    totalRooms: 30,
    availableRooms: 3,
    images: ['/images/hotel4.jpg'],
    amenities: ['Free WiFi', 'Heritage Decor', 'Restaurant', 'Garden'],
    isFeatured: true,
    phone: '+94 81 345 6789',
    address: '123 Main Street, Kandy'
  }
];

export default function HotelsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });

  const cities = ['Colombo', 'Negombo', 'Kandy'];

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
    const matchesPrice = hotel.pricePerNight >= priceRange.min && hotel.pricePerNight <= priceRange.max;
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
      {/* Header */}
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
        {/* Search & Filter Section */}
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

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
          {filteredHotels.map((hotel, index) => (
            <Link
              key={hotel.id}
              href={`/hotel/${hotel.id}`}
              className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
              style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
            >
              {/* Hotel Image */}
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

              {/* Hotel Info */}
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {hotel.businessName}
                </h3>

                <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
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
                    <span>{hotel.availableRooms} Rooms Available</span>
                  </div>
                </div>

                <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                  {hotel.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity, i) => (
                    <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      {getAmenityIcon(amenity)} {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Price and Book */}
              <div className="mt-md pt-md border-t border-surface-variant">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#9bb4d0] uppercase tracking-wider">Starting from</div>
                    <div className="font-display text-lg font-bold text-[#5dcaa5]">
                      Rs. {hotel.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-[#9bb4d0]">/night</span>
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

        {filteredHotels.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No hotels found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
