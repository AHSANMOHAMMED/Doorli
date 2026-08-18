"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scissors, Star, MapPin, Clock, Calendar } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type BeautyVendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  rating?: number;
  totalReviews?: number;
  images?: string[];
  amenities?: string[];
  isFeatured?: boolean;
  phone?: string | null;
  address?: string | null;
  openingHours?: string | null;
  services?: { name: string; price: number; duration: string }[];
};

export default function BeautyPage() {
  const [vendors, setVendors] = useState<BeautyVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedService, setSelectedService] = useState('all');

  async function loadBeauty() {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch<{ items: BeautyVendor[] } | BeautyVendor[]>('/vendors?category=beauty');
      setVendors(Array.isArray(d) ? d : d?.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load beauty services');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBeauty();
  }, []);

  const cities = [...new Set(vendors.map(v => v.city).filter(Boolean))] as string[];
  const serviceTypes = [...new Set(
    vendors.flatMap(v => (v.services || []).map(s => s.name.split(' ')[0]))
  )];

  const filteredServices = vendors.filter(service => {
    const matchesSearch = service.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || service.city === selectedCity;
    const matchesService = selectedService === 'all' ||
                          (service.services || []).some(s => s.name.toLowerCase().includes(selectedService.toLowerCase()));
    return matchesSearch && matchesCity && matchesService;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Beauty & Wellness</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
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

        {loading && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            <p className="text-[#9bb4d0] mt-4">Loading beauty services...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button type="button" onClick={() => void loadBeauty()} className="doorli-cta-primary mt-3 px-4 py-2 text-sm">Try again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-lg">
            {filteredServices.map((service, index) => (
              <Link
                key={service.id}
                href={`/beauty/${service.id}`}
                className="group relative p-lg rounded-2xl bg-surface-container-high border border-surface-variant hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-slide-up hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
              >
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

                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {service.businessName}
                  </h3>

                  <div className="flex items-center gap-4 mb-3 text-sm text-[#9bb4d0]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#fac775]" />
                      <span>{service.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#378add]" />
                      <span>{service.city}</span>
                    </div>
                    {service.openingHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-[#5dcaa5]" />
                        <span>{service.openingHours}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#9bb4d0] mb-3 line-clamp-2">
                    {service.description || `${service.businessName} - Beauty & Wellness services`}
                  </p>

                  {(service.services || []).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Available Services</h4>
                      <div className="space-y-2">
                        {service.services!.slice(0, 3).map((svc, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-[#9bb4d0]">{svc.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#5dcaa5] font-medium">Rs. {svc.price.toLocaleString()}</span>
                              <span className="text-xs text-[#9bb4d0]">({svc.duration})</span>
                            </div>
                          </div>
                        ))}
                        {service.services!.length > 3 && (
                          <div className="text-xs text-[#9bb4d0]">
                            +{service.services!.length - 3} more services
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(service.amenities || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {service.amenities!.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          {amenity}
                        </span>
                      ))}
                      {service.amenities!.length > 3 && (
                        <span className="text-xs bg-surface-variant px-2 py-1 rounded text-[#9bb4d0]">
                          +{service.amenities!.length - 3} more
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
                        Rs. {Math.min(...(service.services || []).map(s => s.price)).toLocaleString()}
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
        )}

        {!loading && !error && filteredServices.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="text-[#9bb4d0] mb-2">No beauty services found matching your criteria</div>
            <div className="text-xs text-surface-variant">Try adjusting your search or filters</div>
          </div>
        )}
      </main>
    </div>
  );
}
