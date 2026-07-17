import dotenv from 'dotenv';
import path from 'path';
import { NotificationService } from './notification.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  const notifications = new NotificationService(redisUrl);
  const connected = await notifications.ping();
  console.log(`Doorli Notifications Service — Redis: ${connected ? 'connected' : 'disconnected'}`);
  console.log('Channels: FCM push, MSG91 SMS, in-app (Prisma)');

  const worker = notifications.startWorker();
  worker.on('failed', (job, err) => {
    console.error(`[notifications] job ${job?.id} failed`, err.message);
  });

  process.on('SIGINT', async () => {
    await worker.close();
    await notifications.close();
    process.exit(0);
  });
}

main().catch(console.error);
