import { Request, Response } from 'express';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

export const getForums = async (req: Request, res: Response) => {
  try {
    const forums = await prisma.forum.findMany({ where: { isActive: true } });
    res.json({ data: forums });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createForum = async (req: Request, res: Response) => {
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

export const getThreads = async (req: Request, res: Response) => {
  try {
    const { forumId } = req.params;
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

export const createThread = async (req: Request, res: Response) => {
  try {
    const { forumId } = req.params;
    // In real app, authorId comes from authenticated user context (JWT)
    const { title, content, authorId } = req.body;
    
    const thread = await prisma.thread.create({
      data: { forumId, title, content, authorId },
    });
    res.status(201).json({ data: thread });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
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

export const createPost = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { content, authorId, parentId } = req.body;

    const post = await prisma.post.create({
      data: { threadId, content, authorId, parentId },
    });
    res.status(201).json({ data: post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
