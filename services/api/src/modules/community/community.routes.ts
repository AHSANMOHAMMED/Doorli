import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const communityRouter = Router();
const postType = z.enum(['general', 'recommendation', 'lost_found', 'giveaway', 'safety_alert']);

communityRouter.get('/feed', async (req, res, next) => {
  try {
    const locality = String(req.query.locality || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const items = await prisma.communityPost.findMany({
      where: { isDeleted: false, ...(locality ? { locality: { contains: locality, mode: 'insensitive' } } : {}) },
      include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true } }, _count: { select: { flags: true } } },
      orderBy: { createdAt: 'desc' }, take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const visible = hasMore ? items.slice(0, limit) : items;
    res.json({ success: true, data: { items: visible, nextCursor: hasMore ? visible[visible.length - 1].id : null } });
  } catch (err) { next(err); }
});

communityRouter.post('/posts', authenticateToken, async (req, res, next) => {
  try {
    const body = z.object({ type: postType, content: z.string().min(3).max(2000), locality: z.string().min(2).max(100), mediaUrls: z.array(z.string().url()).default([]) }).parse(req.body);
    const post = await prisma.communityPost.create({ data: { ...body, userId: req.user!.id } });
    if (body.type === 'safety_alert') {
      const users = await prisma.user.findMany({ where: { isActive: true, locality: { contains: body.locality, mode: 'insensitive' } }, select: { id: true }, take: 500 });
      if (users.length) await prisma.notification.createMany({ data: users.map((user) => ({ userId: user.id, title: `Safety Alert - ${body.locality}`, body: body.content.slice(0, 120), type: 'safety_alert', data: { postId: post.id, locality: body.locality } })) });
    }
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
});

communityRouter.delete('/posts/:id', authenticateToken, async (req, res, next) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: String(req.params.id) } });
    if (!post) throw new AppError(404, 'Post not found');
    if (post.userId !== req.user!.id && req.user!.role !== 'admin') throw new AppError(403, 'Not authorised to delete this post');
    await prisma.communityPost.update({ where: { id: post.id }, data: { isDeleted: true } });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

communityRouter.post('/posts/:id/report', authenticateToken, async (req, res, next) => {
  try {
    const postId = String(req.params.id);
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new AppError(404, 'Post not found');
    const flag = await prisma.moderationFlag.create({ data: { postId, userId: req.user!.id, reason: z.string().max(500).optional().parse(req.body?.reason) } });
    res.status(201).json({ success: true, data: { reported: true, flagId: flag.id } });
  } catch (err) { next(err); }
});

communityRouter.get('/events', async (req, res, next) => {
  try {
    const locality = String(req.query.locality || '').trim();
    const posts = await prisma.communityPost.findMany({ where: { type: 'general', isDeleted: false, ...(locality ? { locality: { contains: locality, mode: 'insensitive' } } : {}) }, orderBy: { createdAt: 'desc' }, take: 20 });
    res.json({ success: true, data: posts });
  } catch (err) { next(err); }
});

export default communityRouter;
