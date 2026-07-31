import { z } from 'zod';

// Enhanced booking schema with hotel/hall specifics
export const createHotelBookingSchema = z.object({
  hotelId: z.string().min(1, 'Hotel ID is required'),
  bookingType: z.literal('hotel'),
  checkInDate: z.string().min(1, 'Check-in date is required').date(),
  checkOutDate: z.string().min(1, 'Check-out date is required').date(),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(20, 'Guest count cannot exceed 20'),
  roomType: z.enum(['standard', 'deluxe', 'suite', 'family'], {
    message: 'Room type must be one of: standard, deluxe, suite, family'
  }).default('standard'),
  specialRequests: z.string().max(1000, 'Special requests cannot exceed 1000 characters').optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  depositAmount: z.number().positive().optional(),
  paymentMethod: z.enum(['card', 'wallet', 'cod']).default('card'),
  customerInfo: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Invalid phone number'),
    email: z.string().email().optional(),
  }),
});

export const createHallBookingSchema = z.object({
  hallId: z.string().min(1, 'Hall ID is required'),
  bookingType: z.literal('hall'),
  eventDate: z.string().min(1, 'Event date is required').date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  guestCount: z.number().int().min(1).max(5000, 'Guest count cannot exceed 5000'),
  eventType: z.enum(['wedding', 'conference', 'party', 'social', 'reception'], {
    message: 'Event type must be one of: wedding, conference, party, social, reception'
  }),
  catering: z.boolean().default(false),
  audioVideo: z.boolean().default(false),
  decorations: z.boolean().default(false),
  specialRequests: z.string().max(2000).optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  depositAmount: z.number().positive().optional(),
  paymentMethod: z.enum(['card', 'wallet', 'cod']).default('card'),
  customerInfo: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\+?[0-9\s\-\(\)]+$/, 'Invalid phone number'),
    email: z.string().email().optional(),
    company: z.string().optional(), // For corporate events
  }),
});

export type CreateHotelBookingInput = z.infer<typeof createHotelBookingSchema>;
export type CreateHallBookingInput = z.infer<typeof createHallBookingSchema>;
