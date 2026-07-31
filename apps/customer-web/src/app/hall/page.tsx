"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Star, MapPin, ShoppingCart } from 'lucide-react';

// Sample hall data
const halls = [
  {
    id: 'hall-001',
    businessName: 'Grand Banquet Hall',
    category: 'hall',
    description: 'Elegant wedding hall for up to 500 guests',
    city: 'Colombo',
    basePrice: 75000,
    rating: 4.8,
    capacity: { min: 50, max: 500 },
    images: ['/images/hall1.jpg'],
    amenities: ['Air Conditioning', 'Lighting', 'Sound System', 'Parking', 'Catering', 'Dance Floor'],
    isFeatured: true,
    phone: '+94 11 123 4567',
    address: '123 Main Street, Colombo'
  },
  {
    id: 'hall-002',
    businessName: 'City Convention Center',
    category: 'hall',
    description: 'Professional conference center with modern facilities',
    city: 'Kandy',
    basePrice: 45000,
    rating: 4.5,
    capacity: { min: 100, max: 800 },
    images: ['/images/hall2.jpg'],
    amenities: ['AV Equipment', 'WiFi', 'Projector', 'Parking', 'Catering', 'Security'],
    isFeatured: false,
    phone: '+94 81 234 5678',
    address: '45 Lake Road, Kandy'
  },
  {
    id: 'hall-003',
    businessName: 'Sunset Garden Venue',
    category: 'hall',
    description: 'Beautiful outdoor wedding venue with garden scenery',
    city: 'Negombo',
    basePrice: 60000,
    rating: 4.9,
    capacity: { min: 80, max: 400 },
    images: ['/images/hall3.jpg'],
    amenities: ['Garden', 'Outdoor Seating', 'Catering', 'Parking', 'Photography', 'Lighting'],
    isFeatured: true,
    phone: '+94 31 345 6789',
    address: 'Beach Road, Negombo'
  }
];

export default function HallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [eventType, setEventType] = useState('all');

  const cities = ['Colombo', 'Kandy', 'Negombo'];
  const eventTypes = ['Wedding', 'Conference', 'Party', 'Conference', 'Social'];

  const filteredHalls = halls.filter(hall => {
    const matchesSearch = hall.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hall.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hall.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || hall.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
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
        {/* Search & Filter Section */}
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

        {/* Halls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
          {filteredHalls.map((hall, index) => (
            <Link
              key={hall.id}
              href={`/hall/${hall.id}`}
              className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-tertiary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
              style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
            >
              {/* Hall Image */}
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

              {/* Hall Info */}
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-tertiary transition-colors">
                  {hall.businessName}
                </h3>

                <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#fac775]" />
                    <span>{hall.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#378add]" />
                    <span>{hall.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#5dcaa5]" />
                    <span>{hall.capacity.min}-{hall.capacity.max} Guests</span>
                  </div>
                </div>

                <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                  {hall.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {hall.amenities.slice(0, 4).map((amenity, i) => (
                    <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      {amenity}
                    </span>
                  ))}
                  {hall.amenities.length > 4 && (
                    <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      +{hall.amenities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Price and Book */}
              <div className="mt-md pt-md border-t border-surface-variant">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#9bb4d0] uppercase tracking-wider">Starting from</div>
                    <div className="font-display text-lg font-bold text-[#fac775]">
                      Rs. {hall.basePrice.toLocaleString()}<span className="text-xs font-normal text-[#9bb4d0]">/day</span>
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

        {filteredHalls.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No venues found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
