import { z } from 'zod';

export const CreateDeliverySubscriptionSchema = z.object({
  vendorId: z.string().uuid(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  deliveryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  deliveryAddressId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  nextDeliveryAt: z.string().datetime(),
});

export const UpdateDeliverySubscriptionSchema = CreateDeliverySubscriptionSchema.omit({
  vendorId: true,
}).partial();

export const PauseSubscriptionSchema = z.object({
  pauseUntil: z.string().datetime(),
});

export const CancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateDeliverySubscriptionInput = z.infer<typeof CreateDeliverySubscriptionSchema>;
export type UpdateDeliverySubscriptionInput = z.infer<typeof UpdateDeliverySubscriptionSchema>;
