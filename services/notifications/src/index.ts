import dotenv from 'dotenv';
import path from 'path';
import { NotificationService } from './notification.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  const notifications = new NotificationService(redisUrl);
  const connected = await notifications.ping();
  console.log(`Doorli Notifications Service — Redis: ${connected ? 'connected' : 'disconnected'}`);
  console.log('FCM/MSG91 integration ships in Week 15–16');

  const worker = notifications.startWorker();
  process.on('SIGINT', async () => {
    await worker.close();
    await notifications.close();
    process.exit(0);
  });
}

main().catch(console.error);
