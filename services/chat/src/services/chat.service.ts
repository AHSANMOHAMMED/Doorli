import { prisma } from '../lib/prisma.js';

export async function createOrGetConversation(userId: string, participantId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
    include: { participants: { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true, role: true } } } } },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: participantId }],
      },
    },
    include: { participants: { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true, role: true } } } } },
  });
}

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true, role: true } } } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, content: true, senderId: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getMessages(conversationId: string, userId: string, cursor?: string, limit = 20) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId } },
    },
  });

  if (!conversation) return null;

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { sender: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
  });

  let nextCursor: string | null = null;
  if (messages.length > limit) {
    const nextMessage = messages.pop();
    nextCursor = nextMessage?.id ?? null;
  }

  return { messages, nextCursor };
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: senderId } },
    },
  });

  if (!conversation) return null;

  const message = await prisma.chatMessage.create({
    data: { conversationId, senderId, content },
    include: { sender: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  return message;
}

export async function markAsRead(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId } },
    },
  });

  if (!conversation) return null;

  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true };
}

export async function getUnreadCount(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    select: { id: true },
  });

  let totalUnread = 0;
  const unreadByConversation: Record<string, number> = {};

  for (const conv of conversations) {
    const count = await prisma.chatMessage.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        isRead: false,
      },
    });
    if (count > 0) {
      unreadByConversation[conv.id] = count;
      totalUnread += count;
    }
  }

  return { totalUnread, unreadByConversation };
}
