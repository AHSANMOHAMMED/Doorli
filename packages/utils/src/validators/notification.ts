import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  type: z.enum([
    'order_update',
    'booking_update',
    'delivery_update',
    'ride_update',
    'promo',
    'system',
    'sos',
    'payment',
    'loyalty',
    'forum',
    'service_request',
  ]),
  data: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.enum(['push', 'sms', 'in_app'])).min(1).default(['in_app']),
});

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(), // empty = mark all as read
});

export const RegisterDeviceTokenSchema = z.object({
  deviceToken: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().max(200).optional(),
});

export const SendBroadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  type: z.string().max(50).default('system'),
  data: z.record(z.string(), z.unknown()).optional(),
  targetRoles: z.array(z.enum(['customer', 'vendor', 'driver', 'admin'])).optional(),
  targetUserIds: z.array(z.string().uuid()).optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type RegisterDeviceTokenInput = z.infer<typeof RegisterDeviceTokenSchema>;
export type SendBroadcastNotificationInput = z.infer<typeof SendBroadcastNotificationSchema>;
