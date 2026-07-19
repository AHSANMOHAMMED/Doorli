import { z } from 'zod';

export const vendorCategorySchema = z.enum([
  'grocery',
  'restaurant',
  'hotel',
  'hall',
  'service',
  'beauty',
]);

export const createVendorSchema = z.object({
  businessName: z.string().min(2).max(150),
  category: vendorCategorySchema,
  description: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  addressLine: z.string().min(5).max(500),
  city: z.string().max(80).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  deliveryRadiusKm: z.coerce.number().int().min(1).max(50).default(5),
  minOrderAmount: z.coerce.number().min(0).optional(),
  openingHours: z.record(z.object({ open: z.string(), close: z.string() })).optional(),
});

export const updateVendorSchema = createVendorSchema.partial().extend({
  isOpen: z.boolean().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

export const nearbyVendorsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.5).max(50).default(5),
  category: vendorCategorySchema.optional(),
});

export const listVendorsSchema = z.object({
  category: vendorCategorySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
