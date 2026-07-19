import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format');

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits'),
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(['customer', 'vendor', 'driver']).default('customer'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100);

/** Customer / vendor password login */
export const passwordLoginSchema = z.object({
  /** email or username */
  identifier: z.string().min(2).max(150),
  password: passwordSchema,
  /** customer | vendor | admin | driver — app must request the role it allows */
  expectedRole: z.enum(['customer', 'vendor', 'driver', 'admin']).default('customer'),
  /** Vendor: business name or vendor UUID (required when expectedRole is vendor) */
  businessKey: z.string().min(1).max(150).optional(),
});

export const registerCustomerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username: letters, numbers, . _ - only')
    .optional(),
  password: passwordSchema,
  phone: phoneSchema.optional(),
});

export const registerVendorSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username: letters, numbers, . _ - only')
    .optional(),
  password: passwordSchema,
  phone: phoneSchema.optional(),
  businessName: z.string().min(2).max(150),
  category: z
    .enum(['grocery', 'restaurant', 'hotel', 'hall', 'service', 'beauty'])
    .default('grocery'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;
