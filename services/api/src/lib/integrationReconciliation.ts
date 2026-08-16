import { prisma } from '@doorli/db';

const PATH_BY_KIND: Record<string, string> = {
  'stock-update': 'stock-update',
  'order-status': 'order-status',
  'product-sync': 'product-sync',
  'customer-sync': 'customer-sync',
};

const MAX_ATTEMPTS = Math.max(Number(process.env.INTEGRATION_MAX_ATTEMPTS || 8), 1);

export async function retryIntegrationFailure(id: string) {
  const failure = await prisma.integrationFailure.findUnique({ where: { id } });
  if (!failure) return { ok: false as const, status: 404, error: 'Integration failure not found' };
  if (failure.status === 'resolved') return { ok: false as const, status: 409, error: 'Integration failure is already resolved' };
  const endpoint = PATH_BY_KIND[failure.kind];
  if (!endpoint) return { ok: false as const, status: 400, error: 'Unsupported integration failure type' };

  const claimed = await prisma.integrationFailure.updateMany({
    where: { id, status: { in: ['pending', 'failed'] } },
    data: { status: 'processing' },
  });
  if (claimed.count !== 1) return { ok: false as const, status: 409, error: 'Integration failure is already being retried' };

  try {
    const baseUrl = (process.env.INTEGRATION_RETRY_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}/api/v1`).replace(/\/$/, '');
    const secret = (process.env.ERP_INTERNAL_SECRET || '').replace(/^Bearer\s+/i, '');
    if (!secret) throw new Error('ERP_INTERNAL_SECRET is not configured');
    const response = await fetch(`${baseUrl}/erp-webhooks/${endpoint}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify(failure.payload),
    });
    const result = await response.json().catch(() => ({})) as Record<string, unknown>;
    const partiallyFailed = typeof result.failed === 'number' && result.failed > 0;
    if (!response.ok || partiallyFailed || result.success === false) {
      const message = String(result.error || result.message || `Retry failed with HTTP ${response.status}`);
      const attempts = failure.attempts + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      const updated = await prisma.integrationFailure.update({
        where: { id },
        data: {
          status: exhausted ? 'failed' : 'pending',
          attempts,
          nextRetryAt: exhausted ? null : new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** Math.min(attempts, 10) * 1000)),
          lastError: message.slice(0, 4000),
        },
      });
      return { ok: false as const, status: 502, error: message, data: updated };
    }
    const resolved = await prisma.integrationFailure.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date(), nextRetryAt: null, lastError: null },
    });
    return { ok: true as const, data: resolved, retry: result };
  } catch (error) {
    const attempts = failure.attempts + 1;
    const message = error instanceof Error ? error.message : String(error);
    const exhausted = attempts >= MAX_ATTEMPTS;
    const updated = await prisma.integrationFailure.update({
      where: { id },
      data: {
        status: exhausted ? 'failed' : 'pending',
        attempts,
        nextRetryAt: exhausted ? null : new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** Math.min(attempts, 10) * 1000)),
        lastError: message.slice(0, 4000),
      },
    });
    return { ok: false as const, status: 502, error: message, data: updated };
  }
}

export async function reconcileIntegrationFailures() {
  const batchSize = Math.min(Math.max(Number(process.env.INTEGRATION_RECONCILIATION_BATCH || 10), 1), 100);
  const due = await prisma.integrationFailure.findMany({
    where: { status: 'pending', nextRetryAt: { lte: new Date() }, attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { nextRetryAt: 'asc' },
    take: batchSize,
    select: { id: true },
  });
  let resolved = 0;
  for (const failure of due) {
    const result = await retryIntegrationFailure(failure.id);
    if (result.ok) resolved++;
  }
  return { attempted: due.length, resolved };
}
