import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  addressLine: z.string().min(3).max(300),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
