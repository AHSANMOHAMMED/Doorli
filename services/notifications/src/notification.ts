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
  channels?: Array<'push' | 'sms' | 'in_app' | 'email'>;
  email?: {
    to: string;
    subject: string;
    html?: string;
    templateId?: string;
    templateData?: Record<string, unknown>;
  };
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
        if (channels.includes('in_app')) {
          await persistInApp(job.data);
        }
        if (channels.includes('email') && job.data.email) {
          await sendEmail(job.data);
        }
      },
      { connection: { url: this.redisUrl, maxRetriesPerRequest: null } },
    );
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

async function persistInApp(payload: NotificationPayload): Promise<void> {
  try {
    // Idempotent-ish: skip if an identical title/body was just written by API enqueue
    const recent = await prisma.notification.findFirst({
      where: {
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        sentAt: { gte: new Date(Date.now() - 60_000) },
      },
    });
    if (recent) return;

    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ? (JSON.parse(JSON.stringify(payload.data)) as object) : undefined,
      },
    });
  } catch (err) {
    console.warn('[notifications] in_app persist failed', err);
  }
}

import { initializeApp, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (will use GOOGLE_APPLICATION_CREDENTIALS or default app)
try {
  initializeApp();
} catch (e) {
  // Ignore if already initialized
}

async function sendFcmPush(payload: NotificationPayload): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID || getApp().options.projectId;

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

  if (!projectId) {
    console.log(`[notifications] FCM dry-run (No Project ID) → ${payload.title}: ${payload.body} (${tokens.length} tokens)`);
    return;
  }

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      type: payload.type,
      ...(payload.data
        ? Object.fromEntries(
            Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
          )
        : {}),
    },
    tokens,
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.warn(`[notifications] FCM error for token ${tokens[idx]}:`, resp.error);
        }
      });
    } else {
      console.log(`[notifications] FCM push sent successfully to ${response.successCount} devices`);
    }
  } catch (err) {
    console.warn('[notifications] FCM send failed', err);
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

async function sendEmail(payload: NotificationPayload): Promise<void> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@doorli.com';
  
  if (!sendgridApiKey) {
    console.log(`[notifications] Email dry-run → To: ${payload.email?.to}, Subject: ${payload.email?.subject || payload.title}`);
    return;
  }

  if (!payload.email?.to) {
    console.warn('[notifications] Email skipped: no recipient address');
    return;
  }

  try {
    const emailData = {
      personalizations: [
        {
          to: [{ email: payload.email.to }],
          subject: payload.email.subject || payload.title,
          ...(payload.email.templateId && payload.email.templateData
            ? { dynamic_template_data: payload.email.templateData }
            : {}),
        },
      ],
      from: { email: fromEmail, name: 'Doorli' },
      content: payload.email.html
        ? [{ type: 'text/html', value: payload.email.html }]
        : [{ type: 'text/plain', value: payload.body }],
      ...(payload.email.templateId ? { template_id: payload.email.templateId } : {}),
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[notifications] Email failed (${response.status}):`, errorText);
    } else {
      console.log(`[notifications] Email sent to ${payload.email.to}`);
    }
  } catch (err) {
    console.warn('[notifications] Email send failed', err);
  }
}

export { NotificationService as default };
