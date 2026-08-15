import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { applyWalletTransaction, transferWalletFunds } from './wallet.service.js';
import crypto from 'node:crypto';

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
    const kyc = await prisma.kycCase.findUnique({ where: { userId: req.user!.id } });
    if (!kyc || kyc.status !== 'approved' || kyc.level < 1) throw new AppError(403, 'Approved KYC is required before requesting a payout');
    const idempotencyKey = String(req.headers['idempotency-key'] || '');
    if (!idempotencyKey) throw new AppError(400, 'A valid Idempotency-Key header is required');
    const existing = await prisma.walletPayout.findUnique({ where: { userId_idempotencyKey: { userId: req.user!.id, idempotencyKey } } });
    if (existing) return res.status(202).json({ success: true, data: { ...existing, amount: Number(existing.amount), replayed: true } });
    const ledger = await applyWalletTransaction({ userId: req.user!.id, amount: -amount, type: 'payout', idempotencyKey: `payout:${idempotencyKey}`, description: `Wallet payout via ${method}`, metadata: { destination } });
    const payout = await prisma.walletPayout.create({ data: { userId: req.user!.id, amount, method, destination, status: 'pending', reference: ledger.transaction.id, idempotencyKey } });
    res.status(202).json({ success: true, data: { payout, balanceAfter: Number(ledger.transaction.balanceAfter), message: 'Payout queued for gateway processing.' } });
  } catch (err) { next(err); }
});

walletRouter.get('/payouts', async (req, res, next) => {
  try { const payouts = await prisma.walletPayout.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 }); res.json({ success: true, data: payouts.map((p) => ({ ...p, amount: Number(p.amount) })) }); } catch (err) { next(err); }
});

walletRouter.get('/payouts/review-queue', requireRole('admin'), async (_req, res, next) => {
  try { res.json({ success: true, data: await prisma.walletPayout.findMany({ where: { status: { in: ['pending', 'processing'] } }, orderBy: { createdAt: 'asc' }, take: 100 }) }); } catch (err) { next(err); }
});

walletRouter.patch('/payouts/:id/settle', requireRole('admin'), async (req, res, next) => {
  try {
    const { status, providerReference, failureReason } = z.object({ status: z.enum(['processing', 'paid', 'failed', 'cancelled']), providerReference: z.string().max(150).optional(), failureReason: z.string().max(500).optional() }).parse(req.body);
    const payout = await prisma.walletPayout.findUnique({ where: { id: String(req.params.id) } });
    if (!payout) throw new AppError(404, 'Payout not found');
    if (!['pending', 'processing'].includes(payout.status)) throw new AppError(409, `Payout is already ${payout.status}`);
    if (['failed', 'cancelled'].includes(status)) {
      await applyWalletTransaction({ userId: payout.userId, amount: Number(payout.amount), type: 'payout_refund', idempotencyKey: `payout-refund:${payout.id}`, reference: payout.id, description: 'Refund for failed wallet payout' });
    }
    const updated = await prisma.walletPayout.update({ where: { id: payout.id }, data: { status, providerReference, failureReason: ['failed', 'cancelled'].includes(status) ? failureReason || 'Payout was not settled' : null, processedAt: ['paid', 'failed', 'cancelled'].includes(status) ? new Date() : null } });
    res.json({ success: true, data: { ...updated, amount: Number(updated.amount) } });
  } catch (err) { next(err); }
});

/** POST /wallet/topup — add funds (Stripe/UPI/bank) */
  walletRouter.post('/topup', async (req, res, next) => {
  try {
    const { amount, method = 'stripe' } = z.object({
      amount: z.number().positive().max(500000),
      method: z.enum(['stripe', 'upi', 'bank']).default('stripe'),
    }).parse(req.body);

    if (method !== 'stripe' || !process.env.STRIPE_SECRET_KEY) {
      throw new AppError(503, 'A configured payment provider is required before wallet top-up');
    }
    const idempotencyKey = String(req.headers['idempotency-key'] || '');
    if (!idempotencyKey) throw new AppError(400, 'A valid Idempotency-Key header is required');
    const existing = await prisma.walletTopupIntent.findUnique({ where: { userId_idempotencyKey: { userId: req.user!.id, idempotencyKey } } });
    if (existing) return res.status(202).json({ success: true, data: { ...existing, amount: Number(existing.amount), replayed: true } });
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await prisma.walletTopupIntent.create({ data: { userId: req.user!.id, amount, method, idempotencyKey } });
    const paymentIntent = await stripeClient.paymentIntents.create({ amount: Math.round(amount * 100), currency: 'lkr', metadata: { walletTopupId: intent.id, userId: req.user!.id } });
    const updated = await prisma.walletTopupIntent.update({ where: { id: intent.id }, data: { providerTransactionId: paymentIntent.id } });
    res.status(202).json({ success: true, data: { ...updated, amount, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, replayed: false } });
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

walletRouter.get('/kyc', async (req, res, next) => {
  try { res.json({ success: true, data: await prisma.kycCase.findUnique({ where: { userId: req.user!.id } }) }); } catch (err) { next(err); }
});

/** POST /wallet/kyc/basic — submit level 1 verification */
walletRouter.post('/kyc/basic', async (req, res, next) => {
  try {
    const { idNumber } = z.object({ idNumber: z.string().min(5).max(80) }).parse(req.body);
    const kyc = await prisma.kycCase.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id, level: 1, status: 'pending', idNumberHash: crypto.createHash('sha256').update(idNumber).digest('hex') }, update: { level: 1, status: 'pending', idNumberHash: crypto.createHash('sha256').update(idNumber).digest('hex'), rejectionReason: null, reviewedAt: null } });
    res.status(202).json({ success: true, data: { ...kyc, message: 'KYC submitted for review.' } });
  } catch (err) { next(err); }
});

/** POST /wallet/kyc/full — submit level 2 verification */
walletRouter.post('/kyc/full', async (req, res, next) => {
  try {
    const { documentUrl } = z.object({ documentUrl: z.string().url() }).parse(req.body);
    const kyc = await prisma.kycCase.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id, level: 2, status: 'pending', documentUrl }, update: { level: 2, status: 'pending', documentUrl, rejectionReason: null, reviewedAt: null } });
    res.status(202).json({ success: true, data: { ...kyc, message: 'Full KYC submitted for review.' } });
  } catch (err) { next(err); }
});

walletRouter.get('/kyc/review-queue', requireRole('admin'), async (_req, res, next) => {
  try { res.json({ success: true, data: await prisma.kycCase.findMany({ where: { status: 'pending' }, orderBy: { submittedAt: 'asc' }, take: 100 }) }); } catch (err) { next(err); }
});

walletRouter.patch('/kyc/:id/review', requireRole('admin'), async (req, res, next) => {
  try {
    const { status, rejectionReason } = z.object({ status: z.enum(['approved', 'rejected']), rejectionReason: z.string().max(500).optional() }).parse(req.body);
    const kyc = await prisma.kycCase.update({ where: { id: String(req.params.id) }, data: { status, rejectionReason: status === 'rejected' ? rejectionReason : null, reviewedBy: req.user!.id, reviewedAt: new Date() } });
    res.json({ success: true, data: kyc });
  } catch (err) { next(err); }
});

export default walletRouter;
