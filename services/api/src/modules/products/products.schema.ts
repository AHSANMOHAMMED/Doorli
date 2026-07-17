import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  unit: z.string().max(50).optional(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  prepTimeMins: z.coerce.number().int().min(0).optional(),
  addons: z
    .array(z.object({ name: z.string(), price: z.number().nonnegative() }))
    .optional(),
  allergens: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkStockUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        productId: z.string().uuid(),
        stockQuantity: z.coerce.number().int().min(0),
      }),
    )
    .min(1)
    .max(100),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
