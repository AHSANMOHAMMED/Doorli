import { Router } from 'express';
import { Response } from 'express';
import type { AuthRequest } from '../types.d.js';
import * as chatService from '../services/chat.service.js';

const router = Router();

router.post('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    const conversation = await chatService.createOrGetConversation(userId, participantId);
    res.status(201).json({ data: conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversations = await chatService.listConversations(userId);
    res.json({ data: conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await chatService.getMessages(conversationId, userId, cursor, limit);

    if (!result) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    res.json({ data: result.messages, nextCursor: result.nextCursor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await chatService.sendMessage(conversationId, userId, content);

    if (!message) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    res.status(201).json({ data: message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conversations/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);

    const result = await chatService.markAsRead(conversationId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    res.json({ data: result, message: 'Messages marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const unreadData = await chatService.getUnreadCount(userId);
    res.json({ data: unreadData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
