import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const loyaltyRouter = Router();
loyaltyRouter.use(authenticateToken);

loyaltyRouter.get('/me', async (req, res, next) => {
  try {
    const points = await prisma.loyaltyPoint.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, points: 0, earned: 0, redeemed: 0 },
      update: {},
    });
    res.json({ success: true, data: points });
  } catch (err) {
    next(err);
  }
});

loyaltyRouter.post('/redeem', async (req, res, next) => {
  try {
    const { points } = z.object({ points: z.number().int().positive() }).parse(req.body);
    const record = await prisma.loyaltyPoint.findUnique({ where: { userId: req.user!.id } });
    if (!record || record.points < points) throw new AppError(400, 'Insufficient points');

    const updated = await prisma.loyaltyPoint.update({
      where: { userId: req.user!.id },
      data: {
        points: { decrement: points },
        redeemed: { increment: points },
      },
    });

    // 1 point = 1 LKR discount voucher as promo
    const code = `LOYAL${Date.now().toString(36).toUpperCase()}`;
    const promo = await prisma.promoCode.create({
      data: {
        code,
        description: 'Loyalty redemption',
        discountType: 'fixed',
        discountValue: points,
        maxUses: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: { loyalty: updated, promoCode: promo.code } });
  } catch (err) {
    next(err);
  }
});

export default loyaltyRouter;
