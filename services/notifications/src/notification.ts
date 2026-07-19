import dotenv from 'dotenv';
import path from 'path';
import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@doorli/db';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const NOTIFICATION_QUEUE = 'doorli-notifications';

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  channels?: Array<'push' | 'sms' | 'in_app'>;
};

/**
 * Notification service — FCM push + MSG91 SMS + in-app persistence.
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
      return (await client.ping()) === 'PONG';
    } catch {
      return false;
    } finally {
      await client.quit();
    }
  }

  async enqueue(payload: NotificationPayload): Promise<void> {
    await this.queue.add(payload.type, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  startWorker(): Worker {
    return new Worker(
      NOTIFICATION_QUEUE,
      async (job: Job<NotificationPayload>) => {
        const channels = job.data.channels ?? ['push', 'in_app'];
        console.log(`[notifications] job ${job.id} type=${job.name} user=${job.data.userId}`);

        if (channels.includes('push')) {
          await sendFcmPush(job.data);
        }
        if (channels.includes('sms')) {
          await sendSms(job.data);
        }
      },
      { connection: { url: this.redisUrl, maxRetriesPerRequest: null } },
    );
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

async function sendFcmPush(payload: NotificationPayload): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serverKey = process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY;

  let tokens: string[] = [];
  try {
    const devices = await prisma.deviceToken.findMany({
      where: { userId: payload.userId },
      select: { token: true },
    });
    tokens = devices.map((d: { token: string }) => d.token);
  } catch (err) {
    console.warn('[notifications] device token lookup failed', err);
  }

  if (!tokens.length) {
    console.log(`[notifications] no FCM tokens for user ${payload.userId}`);
    return;
  }

  if (!serverKey || !projectId) {
    console.log(`[notifications] FCM dry-run → ${payload.title}: ${payload.body} (${tokens.length} tokens)`);
    return;
  }

  // Legacy FCM HTTP API (works with server key). Prefer HTTP v1 when migrating to service accounts.
  for (const token of tokens) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: { title: payload.title, body: payload.body },
          data: {
            type: payload.type,
            ...(payload.data
              ? Object.fromEntries(
                  Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
                )
              : {}),
          },
        }),
      });
      if (!res.ok) {
        console.warn('[notifications] FCM error', await res.text());
      }
    } catch (err) {
      console.warn('[notifications] FCM send failed', err);
    }
  }
}

async function sendSms(payload: NotificationPayload): Promise<void> {
  const apiKey = process.env.MSG91_API_KEY;
  if (!apiKey) {
    console.log(`[notifications] SMS dry-run → ${payload.body}`);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { phone: true },
    });
    if (!user?.phone) return;

    await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID || 'doorli_notify',
        recipients: [{ mobiles: user.phone, message: payload.body }],
      }),
    });
  } catch (err) {
    console.warn('[notifications] SMS failed', err);
  }
}

export { NotificationService as default };
