import { z } from 'zod';

export const CreateVendorSchema = z.object({
  businessName: z.string().min(2).max(150),
  category: z.enum(['grocery', 'restaurant', 'hotel', 'hall', 'service', 'beauty']),
  description: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  addressLine: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryRadiusKm: z.number().int().min(1).max(50).default(5),
  minOrderAmount: z.number().positive().optional(),
  openingHours: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
