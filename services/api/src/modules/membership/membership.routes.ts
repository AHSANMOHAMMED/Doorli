import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { applyWalletTransaction } from '../wallet/wallet.service.js';

const membershipRouter = Router();
membershipRouter.use(authenticateToken);
const PRICES = { monthly: 299, annual: 2499 } as const;

function nextRenewal(tier: keyof typeof PRICES) {
  const date = new Date();
  if (tier === 'annual') date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

membershipRouter.post('/subscribe', async (req, res, next) => {
  try {
    const { tier } = z.object({ tier: z.enum(['monthly', 'annual']) }).parse(req.body);
    const existing = await prisma.premiumSubscription.findUnique({ where: { userId: req.user!.id } });
    if (existing?.status === 'active') throw new AppError(409, 'Premium membership is already active');
    const price = PRICES[tier];
    const ledger = await applyWalletTransaction({ userId: req.user!.id, amount: -price, type: 'membership_payment', idempotencyKey: String(req.headers['idempotency-key'] || ''), description: `Doorli Premium ${tier}` });
    const subscription = await prisma.premiumSubscription.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, tier, status: 'active', nextRenewalAt: nextRenewal(tier) },
      update: { tier, status: 'active', startedAt: new Date(), nextRenewalAt: nextRenewal(tier), cancelAt: null },
    });
    await prisma.notification.create({ data: { userId: req.user!.id, title: 'Doorli Premium activated', body: `Your ${tier} membership is active.`, type: 'membership', data: { transactionId: ledger.transaction.id } } });
    res.status(201).json({ success: true, data: { ...subscription, totalSavings: Number(subscription.totalSavings), balanceAfter: Number(ledger.transaction.balanceAfter) } });
  } catch (err) { next(err); }
});

membershipRouter.get('/status', async (req, res, next) => {
  try {
    const subscription = await prisma.premiumSubscription.findUnique({ where: { userId: req.user!.id } });
    if (!subscription || (subscription.status !== 'active' && !subscription.cancelAt)) return res.json({ success: true, data: { active: false, tier: null } });
    res.json({ success: true, data: { active: subscription.status === 'active', ...subscription, totalSavings: Number(subscription.totalSavings) } });
  } catch (err) { next(err); }
});

membershipRouter.post('/cancel', async (req, res, next) => {
  try {
    const subscription = await prisma.premiumSubscription.findUnique({ where: { userId: req.user!.id } });
    if (!subscription || subscription.status !== 'active') throw new AppError(404, 'No active membership found');
    const updated = await prisma.premiumSubscription.update({ where: { id: subscription.id }, data: { cancelAt: subscription.nextRenewalAt } });
    res.json({ success: true, data: { cancelled: true, activeUntil: updated.nextRenewalAt } });
  } catch (err) { next(err); }
});

export default membershipRouter;
