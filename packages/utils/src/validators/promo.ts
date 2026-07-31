import { z } from 'zod';

export const CreatePromoCodeSchema = z.object({
  code: z.string().min(3).max(40).toUpperCase(),
  description: z.string().max(500).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicableCategories: z.array(z.string()).optional(),
  vendorId: z.string().uuid().optional(), // null for platform-wide promos
});

export const UpdatePromoCodeSchema = CreatePromoCodeSchema.omit({ code: true }).partial();

export const ValidatePromoCodeSchema = z.object({
  code: z.string().min(3).max(40),
  orderAmount: z.number().positive(),
  vendorId: z.string().uuid().optional(),
});

export type CreatePromoCodeInput = z.infer<typeof CreatePromoCodeSchema>;
export type ValidatePromoCodeInput = z.infer<typeof ValidatePromoCodeSchema>;
