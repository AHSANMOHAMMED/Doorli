"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Scissors, Star, MapPin, Clock, Calendar } from 'lucide-react';

const beautyServices = [
  {
    id: 'beauty-001',
    businessName: 'Glamour Studio',
    category: 'beauty',
    description: 'Premium beauty salon offering hair, skin, and nail treatments',
    city: 'Colombo',
    services: [
      { name: 'Haircut & Styling', price: 2500, duration: '45 min' },
      { name: 'Facial Treatment', price: 3500, duration: '60 min' },
      { name: 'Manicure & Pedicure', price: 2000, duration: '50 min' },
      { name: 'Bridal Makeup', price: 15000, duration: '120 min' },
    ],
    rating: 4.8,
    totalReviews: 234,
    images: ['/images/beauty1.jpg'],
    amenities: ['Air Conditioning', 'Parking', 'WiFi', 'Refreshments'],
    isFeatured: true,
    phone: '+94 11 111 2222',
    address: '45 Galle Road, Colombo 03',
    openingHours: '9:00 AM - 8:00 PM',
  },
  {
    id: 'beauty-002',
    businessName: 'Zen Spa & Wellness',
    category: 'beauty',
    description: 'Relaxing spa treatments and traditional Ayurvedic therapies',
    city: 'Kandy',
    services: [
      { name: 'Full Body Massage', price: 5000, duration: '90 min' },
      { name: 'Ayurvedic Treatment', price: 8000, duration: '120 min' },
      { name: 'Aromatherapy', price: 4000, duration: '60 min' },
      { name: 'Hot Stone Therapy', price: 6000, duration: '75 min' },
    ],
    rating: 4.9,
    totalReviews: 187,
    images: ['/images/beauty2.jpg'],
    amenities: ['Spa', 'Sauna', 'Steam Room', 'Parking', 'Meditation Room'],
    isFeatured: true,
    phone: '+94 81 222 3333',
    address: '78 Peradeniya Road, Kandy',
    openingHours: '10:00 AM - 9:00 PM',
  },
  {
    id: 'beauty-003',
    businessName: 'Style Lab Barber Shop',
    category: 'beauty',
    description: 'Modern barber shop for men grooming and styling',
    city: 'Negombo',
    services: [
      { name: 'Classic Haircut', price: 1000, duration: '30 min' },
      { name: 'Beard Trim & Shape', price: 500, duration: '15 min' },
      { name: 'Hot Towel Shave', price: 800, duration: '20 min' },
      { name: 'Hair Color', price: 3000, duration: '60 min' },
    ],
    rating: 4.6,
    totalReviews: 156,
    images: ['/images/beauty3.jpg'],
    amenities: ['WiFi', 'TV', 'Refreshments', 'Parking'],
    isFeatured: false,
    phone: '+94 31 333 4444',
    address: '12 Lewis Place, Negombo',
    openingHours: '8:00 AM - 7:00 PM',
  },
  {
    id: 'beauty-004',
    businessName: 'Nail Art Studio',
    category: 'beauty',
    description: 'Creative nail art and professional nail care services',
    city: 'Colombo',
    services: [
      { name: 'Gel Manicure', price: 2500, duration: '45 min' },
      { name: 'Nail Art Design', price: 1500, duration: '30 min' },
      { name: 'Acrylic Nails', price: 3500, duration: '60 min' },
      { name: 'Nail Repair', price: 800, duration: '20 min' },
    ],
    rating: 4.7,
    totalReviews: 98,
    images: ['/images/beauty4.jpg'],
    amenities: ['Air Conditioning', 'WiFi', 'Comfortable Seating'],
    isFeatured: false,
    phone: '+94 11 444 5555',
    address: '23 Station Road, Colombo 04',
    openingHours: '9:30 AM - 7:30 PM',
  },
  {
    id: 'beauty-005',
    businessName: 'Lash & Brow Bar',
    category: 'beauty',
    description: 'Specialized eyelash and eyebrow enhancement studio',
    city: 'Colombo',
    services: [
      { name: 'Eyelash Extensions', price: 4000, duration: '90 min' },
      { name: 'Eyebrow Shaping', price: 1000, duration: '20 min' },
      { name: 'Lash Lift', price: 3000, duration: '45 min' },
      { name: 'Tinting', price: 1500, duration: '30 min' },
    ],
    rating: 4.8,
    totalReviews: 142,
    images: ['/images/beauty5.jpg'],
    amenities: ['Air Conditioning', 'Private Rooms', 'WiFi'],
    isFeatured: true,
    phone: '+94 11 555 6666',
    address: '56 Bauddhaloka Mawatha, Colombo 07',
    openingHours: '10:00 AM - 6:00 PM',
  },
];

export default function BeautyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedService, setSelectedService] = useState('all');

  const cities = ['Colombo', 'Kandy', 'Negombo'];
  const serviceTypes = ['Hair', 'Facial', 'Massage', 'Nails', 'Eyelash', 'Makeup'];

  const filteredServices = beautyServices.filter(service => {
    const matchesSearch = service.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || service.city === selectedCity;
    const matchesService = selectedService === 'all' || 
                          service.services.some(s => s.name.toLowerCase().includes(selectedService.toLowerCase()));
    return matchesSearch && matchesCity && matchesService;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Beauty & Wellness</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Search & Filter Section */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-md mb-lg animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">Search Salons & Spas</label>
              <input
                type="text"
                placeholder="Search by name, service, or location..."
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
              <label className="block text-sm text-[#9bb4d0] mb-2">Service Type</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="all">All Services</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Beauty Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
          {filteredServices.map((service, index) => (
            <Link
              key={service.id}
              href={`/beauty/${service.id}`}
              className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
              style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
            >
              {/* Service Image */}
              <div className="relative h-48 bg-surface-variant rounded-lg mb-md">
                <div className="flex items-center justify-center h-full">
                  <Scissors className="w-12 h-12 text-surface-variant" />
                </div>
                {service.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-[#fac775] text-[#121212] text-xs font-bold rounded-full">
                      FEATURED
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-[#185fa5]/80 text-white text-xs rounded-full">
                    {service.city}
                  </span>
                </div>
              </div>

              {/* Service Info */}
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {service.businessName}
                </h3>

                <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#fac775]" />
                    <span>{service.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#378add]" />
                    <span>{service.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#5dcaa5]" />
                    <span>{service.openingHours}</span>
                  </div>
                </div>

                <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                  {service.description}
                </p>

                {/* Available Services */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Available Services</h4>
                  <div className="space-y-2">
                    {service.services.slice(0, 3).map((svc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#9bb4d0]">{svc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#5dcaa5] font-medium">Rs. {svc.price.toLocaleString()}</span>
                          <span className="text-xs text-[#9bb4d0]">({svc.duration})</span>
                        </div>
                      </div>
                    ))}
                    {service.services.length > 3 && (
                      <div className="text-xs text-[#9bb4d0]">
                        +{service.services.length - 3} more services
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.amenities.slice(0, 3).map((amenity, i) => (
                    <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      {amenity}
                    </span>
                  ))}
                  {service.amenities.length > 3 && (
                    <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                      +{service.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Book Button */}
              <div className="mt-md pt-md border-t border-surface-variant">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#9bb4d0] uppercase tracking-wider">Starting from</div>
                    <div className="font-display text-lg font-bold text-[#5dcaa5]">
                      Rs. {Math.min(...service.services.map(s => s.price)).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="doorli-cta-primary px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No beauty services found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
