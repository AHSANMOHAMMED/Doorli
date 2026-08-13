import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const membershipRouter = Router();
membershipRouter.use(authenticateToken);

// In-memory membership store (replace with Prisma model after migration)
const SUBSCRIPTIONS = new Map<string, {
  userId: string; tier: string; status: string;
  startedAt: string; nextRenewalAt: string; totalSavings: number;
}>();

function getNextRenewalDate(tier: 'monthly' | 'annual'): string {
  const d = new Date();
  if (tier === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

const PRICES = { monthly: 299, annual: 2499 } as const;

/** POST /membership/subscribe */
membershipRouter.post('/subscribe', async (req, res, next) => {
  try {
    const { tier } = z.object({ tier: z.enum(['monthly', 'annual']) }).parse(req.body);
    const price = PRICES[tier];

    // Deduct from wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || Number(wallet.balance) < price)
      throw new AppError(400, `Insufficient wallet balance. Need LKR ${price}.`);

    await prisma.wallet.update({ where: { userId: req.user!.id }, data: { balance: { decrement: price } } });

    const sub = {
      userId: req.user!.id,
      tier,
      status: 'active',
      startedAt: new Date().toISOString(),
      nextRenewalAt: getNextRenewalDate(tier),
      totalSavings: 0,
    };
    SUBSCRIPTIONS.set(req.user!.id, sub);

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: '🌟 Welcome to Doorli Premium!',
        body: `Your ${tier} membership is active. Free delivery on all orders. Next renewal: ${new Date(sub.nextRenewalAt).toLocaleDateString()}`,
        type: 'membership',
        data: { tier, nextRenewalAt: sub.nextRenewalAt },
      },
    });

    res.status(201).json({ success: true, data: sub });
  } catch (err) { next(err); }
});

/** GET /membership/status */
membershipRouter.get('/status', async (req, res, next) => {
  try {
    const sub = SUBSCRIPTIONS.get(req.user!.id);
    if (!sub || sub.status !== 'active') {
      return res.json({ success: true, data: { active: false, tier: null } });
    }
    res.json({ success: true, data: { active: true, ...sub } });
  } catch (err) { next(err); }
});

/** POST /membership/cancel */
membershipRouter.post('/cancel', async (req, res, next) => {
  try {
    const sub = SUBSCRIPTIONS.get(req.user!.id);
    if (!sub || sub.status !== 'active') throw new AppError(404, 'No active membership found');
    sub.status = 'cancelled';

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Premium Membership Cancelled',
        body: `Benefits remain active until ${new Date(sub.nextRenewalAt).toLocaleDateString()}.`,
        type: 'membership',
      },
    });

    res.json({ success: true, data: { cancelled: true, activeUntil: sub.nextRenewalAt } });
  } catch (err) { next(err); }
});

export { SUBSCRIPTIONS };
export default membershipRouter;
