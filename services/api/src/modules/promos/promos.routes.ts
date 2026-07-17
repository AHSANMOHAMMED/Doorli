import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const promosRouter = Router();

const createPromoSchema = z.object({
  code: z.string().min(3).max(40),
  description: z.string().optional(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().optional(),
  maxUses: z.number().int().positive().optional(),
  vendorId: z.string().uuid().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

promosRouter.get('/', async (_req, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: promos });
  } catch (err) {
    next(err);
  }
});

promosRouter.post('/validate', authenticateToken, async (req, res, next) => {
  try {
    const code = String(req.body.code || '').toUpperCase();
    const orderAmount = Number(req.body.orderAmount || 0);
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive) throw new AppError(404, 'Invalid promo code');
    if (promo.expiresAt && promo.expiresAt < new Date()) throw new AppError(400, 'Promo expired');
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      throw new AppError(400, 'Promo usage limit reached');
    }
    if (promo.minOrderAmount && orderAmount < Number(promo.minOrderAmount)) {
      throw new AppError(400, `Minimum order ${promo.minOrderAmount} required`);
    }
    const discount =
      promo.discountType === 'percent'
        ? Math.round((orderAmount * Number(promo.discountValue)) / 100)
        : Number(promo.discountValue);
    res.json({ success: true, data: { promo, discount } });
  } catch (err) {
    next(err);
  }
});

promosRouter.post('/', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user || !['admin', 'vendor'].includes(req.user.role)) {
      throw new AppError(403, 'Access denied');
    }
    const input = createPromoSchema.parse(req.body);
    const promo = await prisma.promoCode.create({
      data: {
        code: input.code.toUpperCase(),
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount,
        maxUses: input.maxUses,
        vendorId: input.vendorId,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        isActive: req.user.role === 'admin',
      },
    });
    res.status(201).json({ success: true, data: promo });
  } catch (err) {
    next(err);
  }
});

promosRouter.patch('/:id/approve', authenticateToken, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') throw new AppError(403, 'Access denied');
    const promo = await prisma.promoCode.update({
      where: { id: String(req.params.id) },
      data: { isActive: true },
    });
    res.json({ success: true, data: promo });
  } catch (err) {
    next(err);
  }
});

export default promosRouter;
