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
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user!.id, ...(type ? { type } : {}), ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, orderBy: { createdAt: 'desc' }, take: limit,
    });
    res.json({ success: true, data: transactions.map((item) => ({ ...item, amount: Number(item.amount), balanceAfter: Number(item.balanceAfter) })) });
  } catch (err) { next(err); }
});

walletRouter.get('/auto-topup/rules', async (req, res, next) => {
  try { res.json({ success: true, data: await prisma.autoTopupRule.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } }) }); } catch (err) { next(err); }
});

walletRouter.post('/auto-topup/rules', async (req, res, next) => {
  try {
    const body = z.object({ threshold: z.number().positive(), topupAmount: z.number().positive(), method: z.enum(['stripe', 'upi', 'bank']) }).parse(req.body);
    const rule = await prisma.autoTopupRule.create({ data: { userId: req.user!.id, ...body } });
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
});

walletRouter.delete('/auto-topup/rules/:id', async (req, res, next) => {
  try { await prisma.autoTopupRule.updateMany({ where: { id: String(req.params.id), userId: req.user!.id }, data: { isActive: false } }); res.json({ success: true, data: { disabled: true } }); } catch (err) { next(err); }
});

walletRouter.post('/payout', async (req, res, next) => {
  try {
    const { amount, method, destination } = z.object({ amount: z.number().positive(), method: z.enum(['bank', 'upi']), destination: z.string().min(5) }).parse(req.body);
    const ledger = await applyWalletTransaction({ userId: req.user!.id, amount: -amount, type: 'payout', idempotencyKey: String(req.headers['idempotency-key'] || ''), description: `Wallet payout via ${method}`, metadata: { destination } });
    const payout = await prisma.walletPayout.create({ data: { userId: req.user!.id, amount, method, destination, status: 'pending', reference: ledger.transaction.id } });
    res.status(202).json({ success: true, data: { payout, balanceAfter: Number(ledger.transaction.balanceAfter), message: 'Payout queued for gateway processing.' } });
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
