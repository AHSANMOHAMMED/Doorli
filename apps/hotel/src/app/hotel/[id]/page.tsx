"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Wifi, Car, Coffee, Waves, ArrowLeft, Calendar, Users, Check } from 'lucide-react';

const hotel = {
  id: 'hotel-001',
  businessName: 'Grand Hotel Colombo',
  description: 'Luxury 5-star hotel with spa and pool, offering world-class amenities and exceptional service in the heart of Colombo.',
  city: 'Colombo',
  address: '123 Galle Road, Colombo 03',
  phone: '+94 11 123 4567',
  rating: 4.7,
  totalReviews: 456,
  pricePerNight: 8500,
  amenities: ['Free WiFi', 'Parking', 'Breakfast', 'Pool', 'Spa', 'Air Conditioning', 'Gym', 'Room Service', 'Restaurant', 'Bar'],
  rooms: [
    { id: 'r1', type: 'Standard Room', price: 8500, capacity: 2, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'] },
    { id: 'r2', type: 'Deluxe Room', price: 12000, capacity: 2, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View'] },
    { id: 'r3', type: 'Suite', price: 18000, capacity: 3, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Ocean View', 'Living Area'] },
    { id: 'r4', type: 'Family Room', price: 15000, capacity: 4, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Extra Beds'] },
  ],
  photos: ['/images/hotel1.jpg', '/images/hotel2.jpg', '/images/hotel3.jpg'],
  policies: {
    checkIn: '2:00 PM',
    checkOut: '12:00 PM',
    cancellation: 'Free cancellation up to 24 hours before check-in',
    pets: 'Pets not allowed',
    smoking: 'Non-smoking property',
  },
};

export default function HotelDetailPage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const selectedRoomData = hotel.rooms.find(r => r.id === selectedRoom);
  const nights = calculateNights();
  const totalPrice = selectedRoomData ? selectedRoomData.price * nights : 0;

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes('WiFi')) return <Wifi className="w-5 h-5" />;
    if (amenity.includes('Parking')) return <Car className="w-5 h-5" />;
    if (amenity.includes('Breakfast') || amenity.includes('Restaurant')) return <Coffee className="w-5 h-5" />;
    if (amenity.includes('Pool') || amenity.includes('Spa')) return <Waves className="w-5 h-5" />;
    return <Check className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0f2e] text-white pb-20">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-white/10 bg-[#0a0f2e]/95 backdrop-blur-xl z-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Link href="/" className="text-[#5dcaa5] hover:text-[#4db894]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">{hotel.businessName}</h1>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 md:px-8 py-8">
        {/* Photo Gallery */}
        <div className="grid grid-cols-3 gap-2 mb-8 rounded-2xl overflow-hidden">
          {hotel.photos.map((photo, i) => (
            <div key={i} className="aspect-video bg-[#121a36] flex items-center justify-center">
              <span className="text-4xl">🏨</span>
            </div>
          ))}
        </div>

        {/* Hotel Info */}
        <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-[#fac775]" />
              <span className="font-semibold">{hotel.rating}</span>
              <span className="text-sm text-[#7b8ba3]">({hotel.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-[#7b8ba3]">
              <MapPin className="w-4 h-4" />
              <span>{hotel.city}</span>
            </div>
          </div>

          <p className="text-[#7b8ba3] mb-4">{hotel.description}</p>

          <div className="flex items-center gap-2 text-[#7b8ba3]">
            <span>📞 {hotel.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[#7b8ba3] mt-2">
            <span>📍 {hotel.address}</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {hotel.amenities.map((amenity, i) => (
              <div key={i} className="flex items-center gap-3 text-[#7b8ba3]">
                {getAmenityIcon(amenity)}
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Select Room</h2>
          <div className="space-y-4">
            {hotel.rooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRoom === room.id
                    ? 'border-[#5dcaa5] bg-[#5dcaa5]/10'
                    : 'border-white/10 hover:border-[#5dcaa5]/50'
                }`}
                onClick={() => setSelectedRoom(room.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{room.type}</h3>
                    <p className="text-sm text-[#7b8ba3] mt-1">
                      <Users className="w-4 h-4 inline mr-1" />
                      Up to {room.capacity} guests
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {room.amenities.map((amenity, i) => (
                        <span key={i} className="text-xs bg-[#0a0f2e] px-2 py-1 rounded text-[#7b8ba3]">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#5dcaa5]">
                      Rs. {room.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#7b8ba3]">per night</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        {selectedRoom && (
          <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Book Your Stay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[#7b8ba3] mb-2">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full bg-[#0a0f2e] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#5dcaa5] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {nights > 0 && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[#7b8ba3]">{selectedRoomData?.type}</span>
                  <span>Rs. {selectedRoomData?.price.toLocaleString()} x {nights} nights</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-[#5dcaa5]">Rs. {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              className={`w-full mt-6 py-3 rounded-xl font-semibold text-lg transition-all ${
                !checkIn || !checkOut || nights <= 0
                  ? 'bg-[#1a2340] text-[#5a6a80] cursor-not-allowed'
                  : 'bg-[#5dcaa5] text-[#0a0f2e] hover:bg-[#4db894]'
              }`}
              disabled={!checkIn || !checkOut || nights <= 0}
            >
              {nights <= 0 ? 'Select dates to continue' : `Book for Rs. ${totalPrice.toLocaleString()}`}
            </button>
          </div>
        )}

        {/* Policies */}
        <div className="bg-[#121a36] rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4">Hotel Policies</h2>
          <div className="space-y-3 text-[#7b8ba3]">
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span className="text-white">{hotel.policies.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span className="text-white">{hotel.policies.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancellation:</span>
              <span className="text-white">{hotel.policies.cancellation}</span>
            </div>
            <div className="flex justify-between">
              <span>Pets:</span>
              <span className="text-white">{hotel.policies.pets}</span>
            </div>
            <div className="flex justify-between">
              <span>Smoking:</span>
              <span className="text-white">{hotel.policies.smoking}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
