import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Schema for hotel creation
const createHotelSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.literal('hotel'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string(),
  address: z.string().optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
  pricePerNight: z.number().positive('Price must be positive'),
  rating: z.number().min(1).max(5).optional(),
  totalRooms: z.number().int().min(1, 'Must have at least 1 room'),
  availableRooms: z.number().int().min(0, 'Available rooms cannot be negative'),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createHotelSchema.parse(req.body);
    
    // Generate hotel ID (would typically use UUID or database auto-increment)
    const hotelId = `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create hotel in database
    // For now, we'll simulate successful creation
    const newHotel = {
      id: hotelId,
      ...validatedData,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.status(201).json({
      success: true,
      data: newHotel,
      message: 'Hotel created successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hotel'
    });
  }
});

export default router;
