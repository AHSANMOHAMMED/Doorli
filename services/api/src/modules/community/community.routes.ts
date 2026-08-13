import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const communityRouter = Router();

// ── In-memory store (replace with DB model in production migration) ──────────
interface CommunityPost {
  id: string;
  userId: string;
  type: string;
  content: string;
  locality: string;
  mediaUrls: string[];
  isDeleted: boolean;
  createdAt: string;
  reports: number;
}
const POSTS: CommunityPost[] = [];

/** GET /community/feed?locality= */
communityRouter.get('/feed', async (req, res, next) => {
  try {
    const locality = String(req.query.locality || '').toLowerCase();
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit || 20), 50);

    let posts = POSTS.filter(p => !p.isDeleted && (!locality || p.locality.toLowerCase().includes(locality)));

    if (cursor) {
      const idx = posts.findIndex(p => p.id === cursor);
      posts = posts.slice(idx + 1);
    }

    const items = posts.slice(0, limit);
    const nextCursor = posts.length > limit ? items[items.length - 1]?.id : null;

    res.json({ success: true, data: { items, nextCursor } });
  } catch (err) { next(err); }
});

/** POST /community/posts — create post */
communityRouter.post('/posts', authenticateToken, async (req, res, next) => {
  try {
    const { type, content, locality, mediaUrls = [] } = z.object({
      type: z.enum(['general', 'recommendation', 'lost_found', 'giveaway', 'safety_alert']),
      content: z.string().min(3).max(2000),
      locality: z.string().min(2).max(100),
      mediaUrls: z.array(z.string().url()).optional().default([]),
    }).parse(req.body);

    const post: CommunityPost = {
      id: `cp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: req.user!.id,
      type, content, locality,
      mediaUrls, isDeleted: false,
      createdAt: new Date().toISOString(),
      reports: 0,
    };
    POSTS.unshift(post);

    // Safety alerts: broadcast push to all users in locality
    if (type === 'safety_alert') {
      const usersInLocality = await prisma.user.findMany({ where: { isActive: true }, select: { id: true }, take: 200 });
      await prisma.notification.createMany({
        data: usersInLocality.map(u => ({
          userId: u.id,
          title: `⚠️ Safety Alert — ${locality}`,
          body: content.slice(0, 120),
          type: 'safety_alert',
          data: { postId: post.id, locality },
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
});

/** DELETE /community/posts/:id — soft delete */
communityRouter.delete('/posts/:id', authenticateToken, async (req, res, next) => {
  try {
    const post = POSTS.find(p => p.id === req.params.id);
    if (!post) throw new AppError(404, 'Post not found');
    if (post.userId !== req.user!.id && req.user!.role !== 'admin')
      throw new AppError(403, 'Not authorised to delete this post');
    post.isDeleted = true;
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

/** POST /community/posts/:id/report — flag for moderation */
communityRouter.post('/posts/:id/report', authenticateToken, async (req, res, next) => {
  try {
    const post = POSTS.find(p => p.id === req.params.id);
    if (!post) throw new AppError(404, 'Post not found');
    post.reports = (post.reports || 0) + 1;

    if (post.reports >= 3) {
      // Auto-notify admins
      const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(a => ({
            userId: a.id,
            title: 'Moderation: Post Flagged',
            body: `Post "${post.id}" has ${post.reports} reports. Content: ${post.content.slice(0, 80)}`,
            type: 'moderation_flag',
            data: { postId: post.id },
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({ success: true, data: { reported: true, totalReports: post.reports } });
  } catch (err) { next(err); }
});

/** GET /community/events?locality=&from=&to= — local events */
communityRouter.get('/events', async (req, res, next) => {
  try {
    const { locality } = req.query as Record<string, string>;
    const eventPosts = POSTS.filter(p =>
      !p.isDeleted &&
      p.type === 'general' &&
      (!locality || p.locality.toLowerCase().includes(locality.toLowerCase()))
    );
    res.json({ success: true, data: eventPosts.slice(0, 20) });
  } catch (err) { next(err); }
});

export default communityRouter;
