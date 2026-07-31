import { Response } from 'express';
import { PrismaClient } from '@doorli/db';
import type { AuthRequest } from './types.d.js';

const prisma = new PrismaClient();

export const getForums = async (_req: AuthRequest, res: Response) => {
  try {
    const forums = await prisma.forum.findMany({ where: { isActive: true } });
    res.json({ data: forums });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createForum = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category } = req.body;
    const forum = await prisma.forum.create({
      data: { name, description, category },
    });
    res.status(201).json({ data: forum });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getThreads = async (req: AuthRequest, res: Response) => {
  try {
    const forumId = String(req.params.forumId);
    const threads = await prisma.thread.findMany({
      where: { forumId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
    });
    res.json({ data: threads });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createThread = async (req: AuthRequest, res: Response) => {
  try {
    const forumId = String(req.params.forumId);
    const authorId = req.user!.userId;
    const { title, content } = req.body;

    const thread = await prisma.thread.create({
      data: { forumId, title, content, authorId },
    });
    res.status(201).json({ data: thread });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const lockThread = async (req: AuthRequest, res: Response) => {
  try {
    const threadId = String(req.params.threadId);
    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
    res.json({ data: thread, message: 'Thread locked (mock)' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const threadId = String(req.params.threadId);
    const posts = await prisma.post.findMany({
      where: { threadId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
    });
    res.json({ data: posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const threadId = String(req.params.threadId);
    const authorId = req.user!.userId;
    const { content, parentId } = req.body;

    const post = await prisma.post.create({
      data: { threadId, content, authorId, parentId },
    });
    res.status(201).json({ data: post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = String(req.params.postId);
    const post = await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });
    res.json({ data: post, message: 'Post soft deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
