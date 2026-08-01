'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bed, CalendarDays, Star, Users, MapPin, Edit, Trash2, Eye, TrendingUp } from 'lucide-react';

// Sample data for vendor dashboard
const vendorHotels = [
  {
    id: 'hotel-001',
    businessName: 'Grand Hotel Colombo',
    location: 'Colombo',
    rating: 4.7,
    pricePerNight: 8500,
    totalRooms: 120,
    availableRooms: 15,
    totalBookings: 245,
    occupancyRate: 78,
    revenue: 2125000,
    isActive: true,
    images: ['/images/hotel1.jpg'],
    amenities: ['WiFi', 'Parking', 'Breakfast', 'Pool', 'Spa'],
    lastBooking: '2025-01-28T10:30:00Z'
  },
  {
    id: 'hotel-002',
    businessName: 'Beach Resort Negombo',
    location: 'Negombo',
    rating: 4.3,
    pricePerNight: 4500,
    totalRooms: 85,
    availableRooms: 8,
    totalBookings: 132,
    occupancyRate: 65,
    revenue: 594000,
    isActive: true,
    images: ['/images/hotel2.jpg'],
    amenities: ['Beach Access', 'Parking', 'Restaurant', 'Pool'],
    lastBooking: '2025-01-27T14:15:00Z'
  }
];

const vendorHalls = [
  {
    id: 'hall-001',
    businessName: 'Grand Banquet Hall',
    location: 'Colombo',
    rating: 4.8,
    basePrice: 75000,
    capacity: { min: 50, max: 500 },
    totalBookings: 45,
    revenue: 3375000,
    isActive: true,
    images: ['/images/hall1.jpg'],
    amenities: ['AC', 'Lighting', 'Sound System', 'Parking', 'Catering'],
    nextAvailableDate: '2025-02-15',
    lastBooking: '2025-01-25T09:00:00Z'
  },
  {
    id: 'hall-002',
    businessName: 'City Convention Center',
    location: 'Kandy',
    rating: 4.5,
    basePrice: 45000,
    capacity: { min: 100, max: 800 },
    totalBookings: 23,
    revenue: 1035000,
    isActive: true,
    images: ['/images/hall2.jpg'],
    amenities: ['AV Equipment', 'WiFi', 'Projector', 'Parking'],
    nextAvailableDate: '2025-03-10',
    lastBooking: '2025-01-20T16:45:00Z'
  }
];

export default function HotelHallVendorDashboard() {
  const [activeTab, setActiveTab] = useState('hotels');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statsCards = [
    {
      title: 'Total Hotels',
      value: vendorHotels.length,
      icon: Bed,
      color: 'bg-blue-500/20 text-blue-300'
    },
    {
      title: 'Total Halls',
      value: vendorHalls.length,
      icon: CalendarDays,
      color: 'bg-purple-500/20 text-purple-300'
    },
    {
      title: 'Total Revenue',
      value: `${(vendorHotels.reduce((sum, h) => sum + h.revenue, 0) + vendorHalls.reduce((sum, h) => sum + h.revenue, 0)).toLocaleString()} LKR`,
      icon: TrendingUp,
      color: 'bg-green-500/20 text-green-300'
    },
    {
      title: 'Occupancy Rate',
      value: `${Math.round(((vendorHotels.reduce((sum, h) => sum + h.occupancyRate, 0) + vendorHalls.length * 70) / (vendorHotels.length + vendorHalls.length))).toLocaleString()}%`,
      icon: Star,
      color: 'bg-amber-500/20 text-amber-300'
    }
  ];

  const renderHotelsTab = () => (
    <div className="space-y-md">
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-screen-title text-screen-title text-on-surface">Your Hotels</h2>
        <Link
          href="/vendor/hotel/create"
          className="px-4 py-2 rounded-xl bg-primary-container text-white font-label-medium hover:brightness-110 transition-all"
        >
          Add New Hotel
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {vendorHotels.map((hotel) => (
          <div key={hotel.id} className="bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden hover:border-primary/50 transition-all animate-slide-up">
            <div className="relative h-40 bg-surface-variant">
              <div className="flex items-center justify-center h-full">
                <span className="material-symbols-outlined text-surface-variant text-5xl">hotel</span>
              </div>
              {!hotel.isActive && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-danger/20 text-danger text-xs rounded-full">Inactive</span>
                </div>
              )}
            </div>
            <div className="p-md">
              <h3 className="font-display text-lg font-bold text-white mb-2 hover:text-primary transition-colors">
                {hotel.businessName}
              </h3>
              <div className="space-y-xs mb-md">
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <Star className="w-4 h-4 text-[#fac775]" />
                  <span>{hotel.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <Bed className="w-4 h-4" />
                  <span>{hotel.availableRooms}/{hotel.totalRooms} Available</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <TrendingUp className="w-4 h-4 text-[#5dcaa5]" />
                  <span>{hotel.occupancyRate}% Occupancy</span>
                </div>
              </div>
              <div className="bg-surface-variant rounded-lg p-sm mb-md">
                <div className="text-xs text-[#9bb4d0] mb-1">Today&apos;s Revenue</div>
                <div className="text-lg font-bold text-[#5dcaa5]">Rs. {hotel.revenue.toLocaleString()}</div>
              </div>
              <div className="flex gap-xs">
                <button
                  onClick={() => setSelectedItem(hotel)}
                  className="flex-1 p-2 rounded-lg bg-surface-variant text-[#9bb4d0] hover:bg-surface-variant/80 transition-colors"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <Link
                  href={`/vendor/hotel/${hotel.id}/edit`}
                  className="flex-1 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-center"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => { setSelectedItem(hotel); setShowDeleteConfirm(true); }}
                  className="flex-1 p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHallsTab = () => (
    <div className="space-y-md">
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-screen-title text-screen-title text-on-surface">Your Halls & Venues</h2>
        <Link
          href="/vendor/hall/create"
          className="px-4 py-2 rounded-xl bg-primary-container text-white font-label-medium hover:brightness-110 transition-all"
        >
          Add New Hall
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {vendorHalls.map((hall) => (
          <div key={hall.id} className="bg-surface-container-high rounded-xl border border-surface-variant overflow-hidden hover:border-tertiary/50 transition-all animate-slide-up">
            <div className="relative h-40 bg-surface-variant">
              <div className="flex items-center justify-center h-full">
                <span className="material-symbols-outlined text-surface-variant text-5xl">calendar_today</span>
              </div>
              {!hall.isActive && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-danger/20 text-danger text-xs rounded-full">Inactive</span>
                </div>
              )}
            </div>
            <div className="p-md">
              <h3 className="font-display text-lg font-bold text-white mb-2 hover:text-tertiary transition-colors">
                {hall.businessName}
              </h3>
              <div className="space-y-xs mb-md">
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <MapPin className="w-4 h-4" />
                  <span>{hall.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <Star className="w-4 h-4 text-[#fac775]" />
                  <span>{hall.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <Users className="w-4 h-4" />
                  <span>{hall.capacity.min}-{hall.capacity.max} Guests</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9bb4d0]">
                  <TrendingUp className="w-4 h-4 text-[#fac775]" />
                  <span>Rs. {hall.basePrice.toLocaleString()}/day</span>
                </div>
              </div>
              <div className="bg-surface-variant rounded-lg p-sm mb-md">
                <div className="text-xs text-[#9bb4d0] mb-1">Next Available</div>
                <div className="text-lg font-bold text-[#fac775]">{hall.nextAvailableDate}</div>
              </div>
              <div className="flex gap-xs">
                <button
                  onClick={() => setSelectedItem(hall)}
                  className="flex-1 p-2 rounded-lg bg-surface-variant text-[#9bb4d0] hover:bg-surface-variant/80 transition-colors"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <Link
                  href={`/vendor/hall/${hall.id}/edit`}
                  className="flex-1 p-2 rounded-lg bg-tertiary/20 text-tertiary hover:bg-tertiary/30 transition-colors text-center"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => { setSelectedItem(hall); setShowDeleteConfirm(true); }}
                  className="flex-1 p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="w-full top-0 sticky border-b border-surface-variant bg-[#121212] z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary/80">← Home</Link>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary">Doorli Vendor Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-lg border border-outline/20 mr-4">
            <span className="material-symbols-outlined text-sm mr-2 text-primary">business</span>
            <span className="text-caption font-caption text-on-surface-variant">Live ERP Connected</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
          {statsCards.map((card, index) => (
            <div key={card.title} className="bg-surface-container-high rounded-xl p-md border border-surface-variant hover:border-primary/30 transition-all animate-slide-up" style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="text-label-medium text-on-surface">{card.title}</div>
              </div>
              <div className="font-display text-2xl font-bold text-white">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="bg-surface-container-high rounded-xl border border-surface-variant p-1 mb-md">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('hotels')}
              className={`flex-1 px-4 py-3 rounded-xl font-label-medium transition-all ${activeTab === 'hotels' ? 'bg-primary-container text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Hotels & Stays
            </button>
            <button
              onClick={() => setActiveTab('halls')}
              className={`flex-1 px-4 py-3 rounded-xl font-label-medium transition-all ${activeTab === 'halls' ? 'bg-primary-container text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Halls & Venues
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'hotels' ? renderHotelsTab() : renderHallsTab()}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-[#121212] rounded-2xl border border-surface-variant p-lg max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-white mb-sm">Confirm Deletion</h3>
            <p className="text-[#9bb4d0] mb-md">
              Are you sure you want to delete {selectedItem.businessName}? This action cannot be undone.
            </p>
            <div className="flex gap-sm">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-surface-variant text-on-surface-variant font-label-medium hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Delete logic would go here
                  console.log('Deleting:', selectedItem);
                  setShowDeleteConfirm(false);
                  setSelectedItem(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-danger text-white font-label-medium hover:brightness-110 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
