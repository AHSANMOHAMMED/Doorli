import { z } from 'zod';

export const CreateBookingSchema = z.object({
  vendorId: z.string().uuid(),
  bookingType: z.enum(['hotel', 'hall', 'beauty', 'service']),
  checkInDate: z.string().date().optional(),
  checkOutDate: z.string().date().optional(),
  eventDate: z.string().date().optional(),
  startTime: z.string().optional(),  // HH:MM
  endTime: z.string().optional(),
  guestCount: z.number().int().min(1).optional(),
  totalAmount: z.number().positive(),
  depositAmount: z.number().positive().optional(),
  requirements: z.string().max(1000).optional(),
  roomType: z.string().max(100).optional(),
  durationMins: z.number().int().positive().optional(),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
