import { z } from 'zod';

export const CreateForumSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  isPublic: z.boolean().default(true),
});

export const CreateThreadSchema = z.object({
  forumId: z.string().uuid(),
  title: z.string().min(2).max(300),
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().default(false),
});

export const CreatePostSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  parentId: z.string().uuid().optional(),
});

export const UpdateForumSchema = CreateForumSchema.partial();
export const UpdateThreadSchema = CreateThreadSchema.omit({ forumId: true }).partial();
export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const CreateForumBanSchema = z.object({
  userId: z.string().uuid(),
  forumId: z.string().uuid().optional(), // null for global ban
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateForumInput = z.infer<typeof CreateForumSchema>;
export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type CreateForumBanInput = z.infer<typeof CreateForumBanSchema>;
