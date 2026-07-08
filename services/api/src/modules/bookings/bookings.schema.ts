import { z } from 'zod';

export const createBookingSchema = z.object({
  vendorId: z.string().uuid(),
  bookingType: z.enum(['hotel', 'hall', 'beauty', 'service']),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.number().optional(),
  totalAmount: z.number().positive(),
  depositAmount: z.number().optional(),
  requirements: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
