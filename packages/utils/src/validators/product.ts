import { z } from 'zod';

export const CreateProductSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  barcode: z.string().max(64).optional(),
  sku: z.string().max(64).optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(5),
  imageUrl: z.string().url().optional(),
  prepTimeMins: z.number().int().positive().optional(),
  addons: z
    .array(z.object({ name: z.string(), price: z.number() }))
    .optional(),
  allergens: z.array(z.string()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.omit({ vendorId: true }).partial();

export const BulkUpdateStockSchema = z.object({
  updates: z.array(
    z.object({
      productId: z.string().uuid(),
      stockQuantity: z.number().int().min(0),
    }),
  ).min(1),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
