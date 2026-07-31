import { z } from 'zod';

export const CreateTaxPaymentSchema = z.object({
  taxpayerId: z.string().max(100),
  taxType: z.enum(['property', 'income', 'vehicle', 'business', 'other']),
  taxYear: z.number().int().min(2000).max(2100),
  amount: z.number().positive(),
  paymentMethod: z.enum(['card', 'wallet', 'bank_transfer']),
  referenceNumber: z.string().max(100).optional(),
});

export const CreatePermitApplicationSchema = z.object({
  permitType: z.string().min(2).max(150),
  businessName: z.string().max(200).optional(),
  applicantName: z.string().min(2).max(200),
  applicantPhone: z.string().max(20),
  applicantEmail: z.string().email().optional(),
  addressLine: z.string().max(300),
  city: z.string().max(80),
  purpose: z.string().max(1000),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  documents: z.array(z.string().url()).optional(),
});

export const CreateLicenseApplicationSchema = z.object({
  licenseType: z.enum(['business', 'driving', 'professional', 'other']),
  applicantName: z.string().min(2).max(200),
  applicantPhone: z.string().max(20),
  applicantEmail: z.string().email().optional(),
  addressLine: z.string().max(300),
  city: z.string().max(80),
  qualifications: z.string().max(1000).optional(),
  documents: z.array(z.string().url()).optional(),
});

export const CreateComplaintSchema = z.object({
  category: z.enum(['infrastructure', 'sanitation', 'water', 'electricity', 'roads', 'public_safety', 'other']),
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  addressLine: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  isAnonymous: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const CreateDocumentSchema = z.object({
  documentType: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  fileUrl: z.string().url(),
  isEncrypted: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const UpdatePermitStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'expired']),
  reviewNotes: z.string().max(1000).optional(),
});

export const UpdateLicenseStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'suspended', 'expired']),
  reviewNotes: z.string().max(1000).optional(),
  issueDate: z.string().date().optional(),
  expiryDate: z.string().date().optional(),
});

export const UpdateComplaintStatusSchema = z.object({
  status: z.enum(['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed']),
  responseNotes: z.string().max(1000).optional(),
});

export type CreateTaxPaymentInput = z.infer<typeof CreateTaxPaymentSchema>;
export type CreatePermitApplicationInput = z.infer<typeof CreatePermitApplicationSchema>;
export type CreateLicenseApplicationInput = z.infer<typeof CreateLicenseApplicationSchema>;
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
