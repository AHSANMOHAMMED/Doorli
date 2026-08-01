import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { NotificationService } from './notification.js';
import { setSocketServer, registerSocketAuth } from './socket.js';
import { startSocketBridge } from './socketBridge.js';

if (!process.env.ERP_INTERNAL_SECRET) {
  console.error('[FATAL] ERP_INTERNAL_SECRET environment variable is required');
  process.exit(1);
}

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const HEALTH_PORT = Number(process.env.NOTIFICATIONS_HEALTH_PORT || 4007);

async function main() {
  const notifications = new NotificationService(redisUrl);
  const connected = await notifications.ping();
  console.log(`Doorli Notifications Service — Redis: ${connected ? 'connected' : 'disconnected'}`);
  console.log('Channels: FCM push, MSG91 SMS, in-app (Prisma)');

  const worker = notifications.startWorker();
  worker.on('failed', (job, err) => {
    console.error(`[notifications] job ${job?.id} failed`, err.message);
  });

  const app = express();
  const httpServer = createServer(app);
  const ioServer = new Server(httpServer, {
    cors: { origin: '*' },
  });
  
  setSocketServer(ioServer);
  registerSocketAuth(ioServer);
  const stopSocketBridge = startSocketBridge(redisUrl);

  app.get('/health', async (_req, res) => {
    const ok = await notifications.ping();
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'degraded',
      service: 'notifications',
      redis: ok,
    });
  });
  app.post('/api/notifications/enqueue', express.json(), async (req, res) => {
    try {
      const secret = req.headers['x-internal-secret'];
      if (secret !== process.env.ERP_INTERNAL_SECRET) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await notifications.enqueue(req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  httpServer.listen(HEALTH_PORT, () => {
    console.log(`Notifications + WebSocket server listening on port ${HEALTH_PORT}`);
  });

  process.on('SIGINT', async () => {
    await stopSocketBridge();
    await worker.close();
    await notifications.close();
    process.exit(0);
  });
}

main().catch(console.error);
