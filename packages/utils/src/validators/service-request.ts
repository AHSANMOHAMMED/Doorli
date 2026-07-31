import { z } from 'zod';

export const CreateServiceRequestSchema = z.object({
  serviceType: z.string().min(1).max(100),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  addressLine: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isUrgent: z.boolean().default(false),
  offeredRate: z.number().positive().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const UpdateServiceRequestStatusSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed', 'cancelled']),
});

export type CreateServiceRequestInput = z.infer<typeof CreateServiceRequestSchema>;
