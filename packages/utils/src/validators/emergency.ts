import { z } from 'zod';

export const CreateSOSSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z.string().max(500).optional(),
  emergencyType: z.enum(['medical', 'fire', 'police', 'other']).default('other'),
});

export const CreateIncidentSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000),
  incidentType: z.enum(['accident', 'fire', 'flood', 'crime', 'other']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressLine: z.string().max(300).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  isAnonymous: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const UpdateIncidentStatusSchema = z.object({
  status: z.enum(['reported', 'acknowledged', 'in_progress', 'resolved', 'closed']),
  notes: z.string().max(1000).optional(),
});

export const ResolveSOSSchema = z.object({
  resolutionNotes: z.string().max(1000).optional(),
});

export type CreateSOSInput = z.infer<typeof CreateSOSSchema>;
export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof UpdateIncidentStatusSchema>;
