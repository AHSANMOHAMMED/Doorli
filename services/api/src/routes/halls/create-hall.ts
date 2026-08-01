import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Schema for hall creation
const createHallSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.literal('hall'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string(),
  address: z.string().optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
  basePrice: z.number().positive('Base price must be positive'),
  capacity: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1)
  }),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  availableDates: z.array(z.string()).optional(), // ISO date strings
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createHallSchema.parse(req.body);
    
    // Generate hall ID
    const hallId = `hall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create hall in database
    const newHall = {
      id: hallId,
      ...validatedData,
      isFeatured: validatedData.isFeatured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bookings: [],
      rating: 4.5,
      totalBookings: 0
    };
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.status(201).json({
      success: true,
      data: newHall,
      message: 'Hall created successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating hall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hall'
    });
  }
});

// Get all halls for customer search
router.get('/', async (req, res) => {
  try {
    const { city, minPrice, maxPrice, featured, limit = 50 } = req.query;
    
    const halls = [
      {
        id: 'hall-001',
        businessName: 'Grand Banquet Hall',
        category: 'hall',
        description: 'Elegant wedding hall featuring crystal chandeliers, marble floors, and classic architecture. Suitable for weddings, receptions, and corporate events with capacity for 50-500 guests.',
        city: 'Colombo',
        basePrice: 75000,
        capacity: { min: 50, max: 500 },
        images: ['/images/hall1.jpg', '/images/hall1b.jpg', '/images/hall1c.jpg'],
        amenities: ['Air Conditioning', 'Premium Lighting', 'Sound System', 'Parking', 'Catering', 'Dance Floor', 'Photography', 'Security', 'Floral Decor', 'Wedding Cake Station'],
        isFeatured: true,
        phone: '+94 11 123 4567',
        address: '123 Main Street, Colombo',
        rating: 4.8,
        totalBookings: 45,
        availableDates: [
          '2025-02-15',
          '2025-02-16',
          '2025-02-17',
          '2025-03-20',
          '2025-03-21'
        ],
        nearbyAttractions: [
          'Colombo Fort',
          'Gangaramaya Temple',
          'National Museum'
        ]
      },
      {
        id: 'hall-002',
        businessName: 'City Convention Center',
        category: 'hall',
        description: 'Professional conference center with modern AV equipment and breakout rooms',
        city: 'Kandy',
        basePrice: 45000,
        capacity: { min: 100, max: 800 },
        images: ['/images/hall2.jpg'],
        amenities: ['AV Equipment', 'WiFi', 'Projector', 'Parking', 'Catering', 'Security'],
        isFeatured: false,
        phone: '+94 81 234 5678',
        address: '45 Lake Road, Kandy',
        rating: 4.5,
        totalBookings: 23
      }
    ];
    
    let filteredHalls = halls;
    
    if (city && typeof city === 'string') {
      filteredHalls = filteredHalls.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
    }
    
    if (minPrice && maxPrice) {
      filteredHalls = filteredHalls.filter(h => 
        Number(minPrice) <= h.basePrice && h.basePrice <= Number(maxPrice)
      );
    } else if (minPrice) {
      filteredHalls = filteredHalls.filter(h => h.basePrice >= Number(minPrice));
    } else if (maxPrice) {
      filteredHalls = filteredHalls.filter(h => h.basePrice <= Number(maxPrice));
    }
    
    if (featured === 'true') {
      filteredHalls = filteredHalls.filter(h => h.isFeatured);
    }
    
    res.json({
      success: true,
      data: filteredHalls.slice(0, Number(limit)),
      total: filteredHalls.length,
      page: 1,
      pageSize: Number(limit)
    });
    
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch halls'
    });
  }
});

// Get single hall details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.startsWith('hall-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hall ID'
      });
    }
    
    const halls = [
      {
        id: 'hall-001',
        businessName: 'Grand Banquet Hall',
        category: 'hall',
        description: 'Elegant wedding hall featuring crystal chandeliers, marble floors, and classic architecture. Suitable for weddings, receptions, and corporate events with capacity for 50-500 guests.',
        city: 'Colombo',
        basePrice: 75000,
        capacity: { min: 50, max: 500 },
        images: ['/images/hall1.jpg', '/images/hall1b.jpg', '/images/hall1c.jpg'],
        amenities: ['Air Conditioning', 'Premium Lighting', 'Sound System', 'Parking', 'Catering', 'Dance Floor', 'Photography', 'Security', 'Floral Decor', 'Wedding Cake Station'],
        isFeatured: true,
        phone: '+94 11 123 4567',
        address: '123 Main Street, Colombo',
        rating: 4.8,
        totalBookings: 45,
        availableDates: [
          '2025-02-15',
          '2025-02-16',
          '2025-02-17',
          '2025-03-20',
          '2025-03-21'
        ],
        nearbyAttractions: [
          'Colombo Fort',
          'Gangaramaya Temple',
          'National Museum'
        ]
      }
    ];
    
    const hall = halls.find(h => h.id === id);
    
    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found'
      });
    }
    
    res.json({
      success: true,
      data: hall
    });
    
  } catch (error) {
    console.error('Error fetching hall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hall'
    });
  }
});

// Create new hall booking
router.post('/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate booking data
    if (!bookingData.hallId || !bookingData.eventDate || !bookingData.customerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hallId, eventDate, or customerInfo'
      });
    }
    
    // Create booking
    const newBooking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      hallId: bookingData.hallId,
      customerName: bookingData.customerInfo.name,
      customerPhone: bookingData.customerInfo.phone,
      customerEmail: bookingData.customerInfo.email || null,
      eventDate: bookingData.eventDate,
      startTime: bookingData.startTime || '18:00',
      endTime: bookingData.endTime || '22:00',
      guestCount: bookingData.guestCount || 50,
      eventType: bookingData.eventType || 'wedding',
      catering: bookingData.catering || false,
      audioVideo: bookingData.audioVideo || false,
      decorations: bookingData.decorations || false,
      status: 'confirmed',
      totalAmount: bookingData.totalAmount || 75000,
      depositAmount: bookingData.depositAmount || 37500,
      bookingDate: new Date().toISOString(),
      specialRequests: bookingData.specialRequests || '',
      paymentMethod: bookingData.paymentMethod || 'card'
    };
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.status(201).json({
      success: true,
      data: newBooking,
      message: 'Hall booking created successfully'
    });
    
  } catch (error) {
    console.error('Error creating hall booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hall booking'
    });
  }
});

export default router;