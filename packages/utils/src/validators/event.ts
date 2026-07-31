import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  eventDate: z.string().date(),
  guestCount: z.number().int().min(1).optional(),
  budget: z.number().positive().optional(),
  addressLine: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const CreateEventPackageSchema = z.object({
  eventId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  eventDate: z.string().date(),
  guestCount: z.number().int().min(1),
  totalEstimate: z.number().positive().default(0),
  items: z.array(
    z.object({
      vendorId: z.string().uuid(),
      serviceType: z.enum(['venue', 'catering', 'decoration', 'photography', 'entertainment', 'transport']),
      description: z.string().max(500).optional(),
      amount: z.number().positive(),
    }),
  ).optional(),
});

export const UpdateEventPackageSchema = CreateEventPackageSchema.partial();

export const AddEventPackageItemSchema = z.object({
  vendorId: z.string().uuid(),
  serviceType: z.enum(['venue', 'catering', 'decoration', 'photography', 'entertainment', 'transport']),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type CreateEventPackageInput = z.infer<typeof CreateEventPackageSchema>;
export type AddEventPackageItemInput = z.infer<typeof AddEventPackageItemSchema>;
