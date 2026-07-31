import { z } from 'zod';

export const CreateRideRequestSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupAddress: z.string().max(300),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().max(300),
  rideType: z.enum(['standard', 'premium', 'shared']).default('standard'),
  paymentMethod: z.enum(['card', 'wallet', 'cash']).default('cash'),
  promoCode: z.string().max(40).optional(),
  scheduledAt: z.string().datetime().optional(), // null = ASAP
  passengersCount: z.number().int().min(1).max(6).default(1),
  notes: z.string().max(500).optional(),
});

export const UpdateRideStatusSchema = z.object({
  status: z.enum(['accepted', 'arriving', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().max(500).optional(),
});

export const CancelRideSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const EstimateRideFareSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  rideType: z.enum(['standard', 'premium', 'shared']).default('standard'),
});

export type CreateRideRequestInput = z.infer<typeof CreateRideRequestSchema>;
export type EstimateRideFareInput = z.infer<typeof EstimateRideFareSchema>;
