import { Queue, Worker, type Job } from 'bullmq';

/**
 * ERP order-sync retry queue (Req 10.6).
 *
 * The inline `syncOrderToErpIfLinked` call is best-effort; when it fails the
 * order is re-enqueued here and retried 3 times with 1s / 5s / 30s backoff.
 * Sync is idempotent (`erpOrderId` short-circuit), so duplicate jobs are safe.
 */

const ERP_SYNC_QUEUE = 'doorli-erp-sync';

/** Delay before attempt 1, then before retries 2 and 3. */
const RETRY_DELAYS_MS = [1000, 5000, 30000];

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  maxRetriesPerRequest: null,
};

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(ERP_SYNC_QUEUE, { connection });
  }
  return queue;
}

export type ErpSyncJob = { orderId: string };

export async function enqueueErpOrderSync(orderId: string): Promise<void> {
  try {
    await getQueue().add(
      'order-sync',
      { orderId } satisfies ErpSyncJob,
      {
        attempts: RETRY_DELAYS_MS.length,
        delay: RETRY_DELAYS_MS[0],
        backoff: { type: 'erp-sync' },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  } catch (err) {
    console.error('[erp-sync] enqueue failed:', err);
  }
}

/** Failures that will never succeed on retry — complete the job instead. */
const PERMANENT_FAILURES = new Set(['Order not found', 'Vendor not linked to ERP']);

export function startErpSyncWorker(): Worker<ErpSyncJob> {
  const worker = new Worker<ErpSyncJob>(
    ERP_SYNC_QUEUE,
    async (job: Job<ErpSyncJob>) => {
      const { syncOrderToErpIfLinked } = await import('../modules/orders/orders.service.js');
      const result = await syncOrderToErpIfLinked(job.data.orderId);
      if (!result.success && !PERMANENT_FAILURES.has(result.message ?? '')) {
        throw new Error(result.message || 'ERP sync failed');
      }
    },
    {
      connection,
      settings: {
        // attemptsMade is 1-based after a failure: retry 2 waits 5s, retry 3 waits 30s.
        backoffStrategy: (attemptsMade: number) =>
          RETRY_DELAYS_MS[Math.min(attemptsMade, RETRY_DELAYS_MS.length - 1)] ??
          RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1],
      },
    },
  );

  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      console.error(`[erp-sync] order ${job.data.orderId} exhausted retries:`, err.message);
    }
  });
  worker.on('error', (err) => {
    console.error('[erp-sync] worker error:', err.message);
  });

  return worker;
}
