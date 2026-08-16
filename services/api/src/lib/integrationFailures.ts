import { prisma } from '@doorli/db';

export type IntegrationFailureKind = 'stock-update' | 'order-status' | 'product-sync' | 'customer-sync';

export async function recordIntegrationFailure(input: {
  kind: IntegrationFailureKind;
  dedupeKey: string;
  payload: unknown;
  vendorId?: string;
  error: unknown;
}) {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  return prisma.integrationFailure.upsert({
    where: { dedupeKey: input.dedupeKey.slice(0, 255) },
    create: {
      kind: input.kind,
      dedupeKey: input.dedupeKey.slice(0, 255),
      vendorId: input.vendorId,
      payload: input.payload as object,
      attempts: 1,
      nextRetryAt: new Date(),
      lastError: message.slice(0, 4000),
    },
    update: {
      status: 'pending',
      attempts: { increment: 1 },
      nextRetryAt: new Date(),
      lastError: message.slice(0, 4000),
      resolvedAt: null,
    },
  });
}
