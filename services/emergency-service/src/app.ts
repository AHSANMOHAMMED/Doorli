import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import emergencyRoutes from './routes.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026';

export let io: Server;

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  io = new Server(httpServer, {
    cors: { origin: '*' },
    path: '/api/v1/emergency/socket.io'
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (user.role === 'admin') {
      socket.join('admin:sos');
    }
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Inject io into request for the controllers to use
  app.use((req, _res, next) => {
    (req as any).io = io;
    next();
  });

  app.use('/', emergencyRoutes);

  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'emergency-service' });
  });

  return httpServer; // Return the http server instead of app, so we can listen on it in index.ts
}
