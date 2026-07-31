import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const newAddressSchema = z.object({
  label: z.string().max(50).optional(),
  addressLine: z.string().min(3).max(300),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

export const createOrderSchema = z
  .object({
    vendorId: z.string().uuid(),
    items: z.array(orderItemSchema).min(1),
    orderType: z.enum(['delivery', 'pickup']).default('delivery'),
    paymentMethod: z.enum(['cod', 'card']).default('cod'),
    deliveryAddressId: z.string().uuid().optional(),
    newAddress: newAddressSchema.optional(),
    specialInstructions: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.orderType === 'pickup' || data.deliveryAddressId || data.newAddress,
    { message: 'Delivery orders require an address' },
  );

export const previewOrderSchema = z.object({
  vendorId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  orderType: z.enum(['delivery', 'pickup']).default('delivery'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'preparing',
    'ready',
    'picked_up',
    'delivered',
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PreviewOrderInput = z.infer<typeof previewOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
