import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export const NOTIFICATION_QUEUE = 'doorli-notifications';

/**
 * Notification service stub.
 * Week 15–16: FCM push, MSG91 SMS, email via SendGrid.
 */
export class NotificationService {
  private redisUrl: string;
  public queue: Queue;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
    this.queue = new Queue(NOTIFICATION_QUEUE, {
      connection: { url: redisUrl, maxRetriesPerRequest: null },
    });
  }

  async ping(): Promise<boolean> {
    const client = new Redis(this.redisUrl);
    try {
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    } finally {
      await client.quit();
    }
  }

  /** Placeholder worker — processes notification jobs */
  startWorker(): Worker {
    return new Worker(
      NOTIFICATION_QUEUE,
      async (job) => {
        console.log(`[notifications] Processing job ${job.id}:`, job.name);
      },
      { connection: { url: this.redisUrl, maxRetriesPerRequest: null } },
    );
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export { NotificationService as default };
