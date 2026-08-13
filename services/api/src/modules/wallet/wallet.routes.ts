import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { applyWalletTransaction, transferWalletFunds } from './wallet.service.js';

const walletRouter = Router();
walletRouter.use(authenticateToken);

/** GET /wallet/balance — get or auto-create wallet */
walletRouter.get('/balance', async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, balance: 0 },
      update: {},
    });
    res.json({ success: true, data: { balance: Number(wallet.balance), currency: wallet.currency } });
  } catch (err) { next(err); }
});

walletRouter.get('/transactions', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: limit,
    });
    res.json({ success: true, data: transactions.map((item) => ({ ...item, amount: Number(item.amount), balanceAfter: Number(item.balanceAfter) })) });
  } catch (err) { next(err); }
});

/** POST /wallet/topup — add funds (Stripe/UPI/bank) */
walletRouter.post('/topup', async (req, res, next) => {
  try {
    const { amount, method = 'stripe' } = z.object({
      amount: z.number().positive().max(500000),
      method: z.enum(['stripe', 'upi', 'bank']).default('stripe'),
    }).parse(req.body);

    const result = await applyWalletTransaction({ userId: req.user!.id, amount, type: 'topup', idempotencyKey: String(req.headers['idempotency-key'] || ''), description: `Wallet top-up via ${method}` });
    const updated = result.transaction;

    res.json({ success: true, data: { balance: Number(updated.balanceAfter), topupAmount: amount, method, transactionId: updated.id, replayed: result.replayed } });
  } catch (err) { next(err); }
});

/** POST /wallet/pay — deduct for an order/ride/booking/bill */
walletRouter.post('/pay', async (req, res, next) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);

    const result = await applyWalletTransaction({ userId: req.user!.id, amount: -amount, type: 'payment', idempotencyKey: String(req.headers['idempotency-key'] || ''), description: 'Wallet payment' });
    const updated = result.transaction;

    res.json({ success: true, data: { balance: Number(updated.balanceAfter), deducted: amount, transactionId: updated.id, replayed: result.replayed } });
  } catch (err) { next(err); }
});

/** POST /wallet/transfer — P2P transfer to another user */
walletRouter.post('/transfer', async (req, res, next) => {
  try {
    const { toPhone, amount, note } = z.object({
      toPhone: z.string().min(7),
      amount: z.number().positive(),
      note: z.string().optional(),
    }).parse(req.body);

    const toUser = await prisma.user.findFirst({ where: { phone: toPhone } });
    if (!toUser) throw new AppError(404, 'Recipient not found');
    if (toUser.id === req.user!.id) throw new AppError(400, 'Cannot transfer to yourself');

    const idempotencyKey = String(req.headers['idempotency-key'] || '');
    await transferWalletFunds({ fromUserId: req.user!.id, toUserId: toUser.id, amount, idempotencyKey, description: note || `Transfer to ${toUser.fullName}` });

    res.json({ success: true, data: { transferred: amount, to: toUser.fullName, note } });
  } catch (err) { next(err); }
});

/** POST /wallet/kyc/basic — level 1 verification */
walletRouter.post('/kyc/basic', async (req, res, next) => {
  try {
    // In production: validate ID number + phone. Here we just record it.
    z.object({ idNumber: z.string().min(5) }).parse(req.body);
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'KYC Level 1 Approved',
        body: 'Your basic KYC is complete. Daily limit: LKR 10,000.',
        type: 'kyc',
      },
    });
    res.json({ success: true, data: { kycLevel: 1, dailyLimit: 10000 } });
  } catch (err) { next(err); }
});

/** POST /wallet/kyc/full — level 2 verification */
walletRouter.post('/kyc/full', async (req, res, next) => {
  try {
    z.object({ documentUrl: z.string().url() }).parse(req.body);
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'KYC Level 2 Approved',
        body: 'Full KYC complete. Daily limit: LKR 100,000.',
        type: 'kyc',
      },
    });
    res.json({ success: true, data: { kycLevel: 2, dailyLimit: 100000 } });
  } catch (err) { next(err); }
});

export default walletRouter;
