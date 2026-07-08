import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  referenceId: z.string().uuid(),
  referenceType: z.enum(['order', 'booking']),
  amount: z.number().positive(),
  method: z.enum(['card', 'wallet', 'cod']),
  gateway: z.enum(['stripe', 'payhere', 'manual']),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
