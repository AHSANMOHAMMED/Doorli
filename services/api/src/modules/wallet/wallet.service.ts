import { prisma } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';

type LedgerInput = {
  userId: string;
  amount: number;
  type: string;
  idempotencyKey: string;
  reference?: string;
  description?: string;
  metadata?: object;
};

export async function applyWalletTransaction(input: LedgerInput) {
  if (!input.idempotencyKey || input.idempotencyKey.length > 150) {
    throw new AppError(400, 'A valid Idempotency-Key header is required');
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.walletTransaction.findUnique({
      where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) return { transaction: existing, replayed: true };

    const wallet = await tx.wallet.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, balance: 0 },
      update: {},
    });
    const isCredit = input.amount > 0;
    const absoluteAmount = Math.abs(input.amount);
    if (!isCredit && Number(wallet.balance) < absoluteAmount) {
      throw new AppError(400, 'Insufficient wallet balance');
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: isCredit ? { increment: absoluteAmount } : { decrement: absoluteAmount } },
    });
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
        type: input.type,
        amount: input.amount,
        balanceAfter: updated.balance,
        currency: updated.currency,
        reference: input.reference,
        description: input.description,
        metadata: input.metadata,
      },
    });
    return { transaction, replayed: false };
  });
}

export async function transferWalletFunds(input: { fromUserId: string; toUserId: string; amount: number; idempotencyKey: string; description?: string }) {
  if (!input.idempotencyKey || input.idempotencyKey.length > 150) {
    throw new AppError(400, 'A valid Idempotency-Key header is required');
  }
  return prisma.$transaction(async (tx) => {
    const existing = await tx.walletTransaction.findUnique({
      where: { userId_idempotencyKey: { userId: input.fromUserId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) return { transaction: existing, replayed: true };
    const fromWallet = await tx.wallet.upsert({ where: { userId: input.fromUserId }, create: { userId: input.fromUserId, balance: 0 }, update: {} });
    if (Number(fromWallet.balance) < input.amount) throw new AppError(400, 'Insufficient wallet balance');
    const toWallet = await tx.wallet.upsert({ where: { userId: input.toUserId }, create: { userId: input.toUserId, balance: 0 }, update: {} });
    const [fromUpdated, toUpdated] = await Promise.all([
      tx.wallet.update({ where: { id: fromWallet.id }, data: { balance: { decrement: input.amount } } }),
      tx.wallet.update({ where: { id: toWallet.id }, data: { balance: { increment: input.amount } } }),
    ]);
    const outgoing = await tx.walletTransaction.create({ data: { walletId: fromWallet.id, userId: input.fromUserId, idempotencyKey: input.idempotencyKey, type: 'transfer_out', amount: -input.amount, balanceAfter: fromUpdated.balance, currency: fromUpdated.currency, reference: input.toUserId, description: input.description } });
    await tx.walletTransaction.create({ data: { walletId: toWallet.id, userId: input.toUserId, idempotencyKey: `${input.idempotencyKey}:in`, type: 'transfer_in', amount: input.amount, balanceAfter: toUpdated.balance, currency: toUpdated.currency, reference: input.fromUserId, description: input.description } });
    return { transaction: outgoing, replayed: false };
  });
}
