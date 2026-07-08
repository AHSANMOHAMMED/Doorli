import { z } from 'zod';

export const createReviewSchema = z.object({
  vendorId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
