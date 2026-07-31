import { z } from 'zod';

export const UpdateDriverStatusSchema = z.object({
  isOnline: z.boolean(),
});

export const UpdateDriverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(), // km/h
});

export const AcceptDeliverySchema = z.object({
  orderId: z.string().uuid(),
});

export const DeclineDeliverySchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

export const DriverEarningsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'custom']).default('today'),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const RegisterDriverSchema = z.object({
  vehicleType: z.enum(['motorcycle', 'car', 'van', 'bicycle']),
  vehicleMake: z.string().max(80).optional(),
  vehicleModel: z.string().max(80).optional(),
  vehiclePlate: z.string().max(20),
  licenseNumber: z.string().max(50),
  profilePhotoUrl: z.string().url().optional(),
});

export type UpdateDriverStatusInput = z.infer<typeof UpdateDriverStatusSchema>;
export type UpdateDriverLocationInput = z.infer<typeof UpdateDriverLocationSchema>;
export type RegisterDriverInput = z.infer<typeof RegisterDriverSchema>;
