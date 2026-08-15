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
  roomId: z.string().uuid().optional(),
  roomType: z.string().max(100).optional(),
  hallSlotId: z.string().uuid().optional(),
  beautyServiceId: z.string().uuid().optional(),
  idempotencyKey: z.string().max(150).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'completed', 'cancelled']),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
