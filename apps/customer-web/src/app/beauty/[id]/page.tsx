"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Clock, Phone, Calendar, ArrowLeft, Check } from 'lucide-react';

const beautyService = {
  id: 'beauty-001',
  businessName: 'Glamour Studio',
  description: 'Premium beauty salon offering hair, skin, and nail treatments with expert stylists and the latest techniques.',
  city: 'Colombo',
  address: '45 Galle Road, Colombo 03',
  phone: '+94 11 111 2222',
  rating: 4.8,
  totalReviews: 234,
  openingHours: '9:00 AM - 8:00 PM',
  amenities: ['Air Conditioning', 'Parking', 'WiFi', 'Refreshments', 'Private Rooms', 'Online Booking'],
  services: [
    { id: 's1', name: 'Haircut & Styling', price: 2500, duration: '45 min', description: 'Professional haircut with styling by expert stylists' },
    { id: 's2', name: 'Facial Treatment', price: 3500, duration: '60 min', description: 'Deep cleansing facial for radiant skin' },
    { id: 's3', name: 'Manicure & Pedicure', price: 2000, duration: '50 min', description: 'Complete nail care for hands and feet' },
    { id: 's4', name: 'Bridal Makeup', price: 15000, duration: '120 min', description: 'Professional bridal makeup for your special day' },
    { id: 's5', name: 'Hair Color', price: 4000, duration: '90 min', description: 'Full hair coloring with premium products' },
    { id: 's6', name: 'Body Scrub', price: 3000, duration: '45 min', description: 'Exfoliating body scrub for smooth skin' },
  ],
  photos: ['/images/beauty1.jpg', '/images/beauty2.jpg', '/images/beauty3.jpg'],
};

export default function BeautyDetailPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalPrice = beautyService.services
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/beauty" className="text-primary hover:text-primary/80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">{beautyService.businessName}</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Photo Gallery */}
        <div className="grid grid-cols-3 gap-2 mb-lg rounded-xl overflow-hidden">
          {beautyService.photos.map((photo, i) => (
            <div key={i} className="aspect-square bg-surface-variant flex items-center justify-center">
              <span className="text-surface-variant text-4xl">📸</span>
            </div>
          ))}
        </div>

        {/* Service Info */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-[#fac775]" />
              <span className="font-semibold">{beautyService.rating}</span>
              <span className="text-sm text-[#9bb4d0]">({beautyService.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-[#9bb4d0]">
              <MapPin className="w-4 h-4" />
              <span>{beautyService.city}</span>
            </div>
            <div className="flex items-center gap-1 text-[#9bb4d0]">
              <Clock className="w-4 h-4" />
              <span>{beautyService.openingHours}</span>
            </div>
          </div>

          <p className="text-[#9bb4d0] mb-4">{beautyService.description}</p>

          <div className="flex items-center gap-2 text-[#9bb4d0]">
            <Phone className="w-4 h-4" />
            <span>{beautyService.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[#9bb4d0] mt-2">
            <MapPin className="w-4 h-4" />
            <span>{beautyService.address}</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display text-lg font-bold text-white mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {beautyService.amenities.map((amenity, i) => (
              <span key={i} className="px-3 py-1.5 bg-surface-variant rounded-full text-sm text-[#9bb4d0]">
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-lg mb-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-display text-lg font-bold text-white mb-4">Select Services</h2>
          <div className="space-y-3">
            {beautyService.services.map((service) => (
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
                    <p className="text-sm text-[#9bb4d0] mt-1 ml-7">{service.description}</p>
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

        {/* Date & Time Selection */}
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

        {/* Booking Summary */}
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
