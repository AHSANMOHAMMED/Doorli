"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, MapPin, Clock, Phone, Calendar, ArrowLeft, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type BeautyVendorDetail = {
  id: string;
  businessName: string;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number;
  totalReviews?: number;
  openingHours?: string | null;
  amenities?: string[];
  services?: {
    id: string;
    name: string;
    price: number;
    duration: string;
    description?: string;
  }[];
  photos?: string[];
};

export default function BeautyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<BeautyVendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    apiFetch<BeautyVendorDetail>(`/vendors/${id}`)
      .then(setVendor)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load vendor details'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(sid => sid !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalPrice = (vendor?.services || [])
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          <p className="text-[#9bb4d0] mt-4">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error || 'Vendor not found'}</p>
          <Link href="/beauty" className="text-primary hover:underline text-sm">← Back to Beauty</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/beauty" className="text-primary hover:text-primary/80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">{vendor.businessName}</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        <div className="grid grid-cols-3 gap-2 mb-lg rounded-xl overflow-hidden">
          {(vendor.photos || []).slice(0, 3).map((photo, i) => (
            <div key={i} className="aspect-square bg-surface-variant flex items-center justify-center">
              <span className="text-surface-variant text-4xl">📸</span>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-[#fac775]" />
              <span className="font-semibold">{vendor.rating || 'N/A'}</span>
              {vendor.totalReviews && <span className="text-sm text-[#9bb4d0]">({vendor.totalReviews} reviews)</span>}
            </div>
            {vendor.city && (
              <div className="flex items-center gap-1 text-[#9bb4d0]">
                <MapPin className="w-4 h-4" />
                <span>{vendor.city}</span>
              </div>
            )}
            {vendor.openingHours && (
              <div className="flex items-center gap-1 text-[#9bb4d0]">
                <Clock className="w-4 h-4" />
                <span>{vendor.openingHours}</span>
              </div>
            )}
          </div>

          <p className="text-[#9bb4d0] mb-4">{vendor.description || `${vendor.businessName} - Beauty & Wellness`}</p>

          {vendor.phone && (
            <div className="flex items-center gap-2 text-[#9bb4d0]">
              <Phone className="w-4 h-4" />
              <span>{vendor.phone}</span>
            </div>
          )}
          {vendor.address && (
            <div className="flex items-center gap-2 text-[#9bb4d0] mt-2">
              <MapPin className="w-4 h-4" />
              <span>{vendor.address}</span>
            </div>
          )}
        </div>

        {(vendor.amenities || []).length > 0 && (
          <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display text-lg font-bold text-white mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {vendor.amenities!.map((amenity, i) => (
                <span key={i} className="px-3 py-1.5 bg-surface-variant rounded-full text-sm text-[#9bb4d0]">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {(vendor.services || []).length > 0 && (
          <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-lg font-bold text-white mb-4">Select Services</h2>
            <div className="space-y-3">
              {vendor.services!.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedServices.includes(service.id)
                      ? 'border-[#5dcaa5] bg-[#5dcaa5]/10'
                      : 'border-surface-variant hover:border-[#5dcaa5]/50'
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedServices.includes(service.id)
                            ? 'bg-[#5dcaa5] border-[#5dcaa5]'
                            : 'border-surface-variant'
                        }`}>
                          {selectedServices.includes(service.id) && (
                            <Check className="w-3 h-3 text-[#121212]" />
                          )}
                        </div>
                        <h3 className="font-semibold text-white">{service.name}</h3>
                      </div>
                      {service.description && <p className="text-sm text-[#9bb4d0] mt-1 ml-7">{service.description}</p>}
                      <div className="flex items-center gap-3 mt-2 ml-7 text-sm text-[#9bb4d0]">
                        <span>{service.duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-[#5dcaa5]">
                        Rs. {service.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedServices.length > 0 && (
          <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-display text-lg font-bold text-white mb-4">Select Date & Time</h2>

            <div className="mb-4">
              <label className="block text-sm text-[#9bb4d0] mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-surface-variant border border-surface-variant rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9bb4d0] mb-2">Select Time</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-lg text-sm transition-all ${
                      selectedTime === time
                        ? 'bg-[#5dcaa5] text-[#121212] font-semibold'
                        : 'bg-surface-variant text-[#9bb4d0] hover:bg-surface-variant/80'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-surface-variant p-4 z-50">
            <div className="max-w-screen-lg mx-auto flex items-center justify-between">
              <div>
                <div className="text-sm text-[#9bb4d0]">{selectedServices.length} service(s) selected</div>
                <div className="font-display text-xl font-bold text-[#5dcaa5]">Rs. {totalPrice.toLocaleString()}</div>
              </div>
              <button
                className={`doorli-cta-primary px-6 py-3 flex items-center gap-2 ${
                  !selectedDate || !selectedTime ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!selectedDate || !selectedTime}
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
