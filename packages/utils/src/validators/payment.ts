import { z } from 'zod';

export const InitiatePaymentSchema = z.object({
  referenceId: z.string().uuid(),
  referenceType: z.enum(['order', 'booking']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('LKR'),
  method: z.enum(['card', 'wallet', 'cod', 'cash']),
});

export const RefundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
