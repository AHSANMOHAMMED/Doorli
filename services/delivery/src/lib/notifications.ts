import { Queue } from 'bullmq';
import { prisma } from '@doorli/db';

const NOTIFICATION_QUEUE = 'doorli-notifications';

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(NOTIFICATION_QUEUE, {
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        maxRetriesPerRequest: null,
      },
    });
  }
  return queue;
}

export type NotificationJob = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  channels?: Array<'push' | 'sms' | 'in_app'>;
};

export async function enqueueNotification(job: NotificationJob): Promise<void> {
  try {
    // Persist in-app notification immediately
    await prisma.notification.create({
      data: {
        userId: job.userId,
        title: job.title,
        body: job.body,
        type: job.type,
        data: job.data ? (JSON.parse(JSON.stringify(job.data)) as object) : undefined,
      },
    });

    await getQueue().add(job.type, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  } catch (err) {
    console.error('[notifications] enqueue failed', err);
  }
}
