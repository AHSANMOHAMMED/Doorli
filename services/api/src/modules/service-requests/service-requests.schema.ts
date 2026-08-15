import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  serviceType: z.string().min(2).max(100),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  addressLine: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isUrgent: z.boolean().default(false),
  offeredRate: z.number().positive().optional(),
  scheduledAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const acceptServiceRequestSchema = z.object({
  requestId: z.string().uuid(),
});

export const completeServiceRequestSchema = z.object({
  requestId: z.string().uuid(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type AcceptServiceRequestInput = z.infer<typeof acceptServiceRequestSchema>;
export type CompleteServiceRequestInput = z.infer<typeof completeServiceRequestSchema>;
