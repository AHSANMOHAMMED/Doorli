import { z } from 'zod';

export const CreateFlashSaleSchema = z.object({
  productId: z.string().uuid(),
  vendorId: z.string().uuid(),
  discountPct: z.number().min(1).max(99),
  salePrice: z.number().positive(),
  stockLimit: z.number().int().positive().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional(),
});

export const UpdateFlashSaleSchema = CreateFlashSaleSchema.omit({
  productId: true,
  vendorId: true,
}).partial();

export const ActivateFlashSaleSchema = z.object({
  isActive: z.boolean(),
});

export type CreateFlashSaleInput = z.infer<typeof CreateFlashSaleSchema>;
export type UpdateFlashSaleInput = z.infer<typeof UpdateFlashSaleSchema>;
