import { z } from 'zod';

export const CreditLoyaltyPointsSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int().positive(),
  reason: z.string().max(200).optional(),
  orderId: z.string().uuid().optional(),
});

export const RedeemLoyaltyPointsSchema = z.object({
  points: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
});

export const TransferLoyaltyPointsSchema = z.object({
  recipientUserId: z.string().uuid(),
  points: z.number().int().positive(),
  message: z.string().max(200).optional(),
});

export const GetLoyaltyBalanceSchema = z.object({
  userId: z.string().uuid().optional(), // optional for current user
});

export type CreditLoyaltyPointsInput = z.infer<typeof CreditLoyaltyPointsSchema>;
export type RedeemLoyaltyPointsInput = z.infer<typeof RedeemLoyaltyPointsSchema>;
export type TransferLoyaltyPointsInput = z.infer<typeof TransferLoyaltyPointsSchema>;
