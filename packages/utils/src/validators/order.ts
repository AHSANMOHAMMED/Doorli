import { z } from 'zod';

export const CreateOrderSchema = z.object({
  vendorId: z.string().uuid(),
  deliveryAddressId: z.string().uuid().optional(),
  orderType: z.enum(['delivery', 'pickup']).default('delivery'),
  paymentMethod: z.enum(['card', 'wallet', 'cod', 'cash']).default('cod'),
  specialInstructions: z.string().max(500).optional(),
  promoCode: z.string().max(40).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']),
});

export const EstimateDeliveryFeeSchema = z.object({
  vendorId: z.string().uuid(),
  deliveryLat: z.number(),
  deliveryLng: z.number(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
