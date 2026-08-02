import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import chatRoutes from './routes/chat.routes.js';
import { sendMessage } from './services/chat.service.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;

    socket.join(`user:${userId}`);

    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('send-message', async (data: { conversationId: string; content: string }) => {
      try {
        const message = await sendMessage(data.conversationId, userId, data.content);
        if (message) {
          io.to(`conversation:${data.conversationId}`).emit('new-message', message);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark-read', async (data: { conversationId: string }) => {
      try {
        const { markAsRead } = await import('./services/chat.service.js');
        await markAsRead(data.conversationId, userId);
        io.to(`conversation:${data.conversationId}`).emit('messages-read', {
          conversationId: data.conversationId,
          userId,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });

  app.use('/api/v1/chat', chatRoutes);

  app.get('/health/live', (_req: express.Request, res: express.Response) => {
    res.status(200).json({ status: 'ok', service: 'chat-service' });
  });

  return { app, httpServer, io };
}
