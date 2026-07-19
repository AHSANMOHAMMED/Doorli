import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/active', async (_req, res, next) => {
  try {
    const now = new Date();
    const sales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: 'asc' },
      take: 50,
    });
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
});

router.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const sales = await prisma.flashSale.findMany({
      where: { vendorId: String(req.params.vendorId) },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      throw new AppError(403, 'Vendor only');
    }
    const body = z
      .object({
        vendorId: z.string().uuid(),
        productId: z.string().uuid().optional().nullable(),
        title: z.string().min(2).max(150),
        discountPct: z.number().int().min(1).max(90),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .parse(req.body);

    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
      if (!vendor || vendor.id !== body.vendorId) throw new AppError(403, 'Not your vendor');
    }

    const sale = await prisma.flashSale.create({
      data: {
        vendorId: body.vendorId,
        productId: body.productId || null,
        title: body.title,
        discountPct: body.discountPct,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      throw new AppError(403, 'Vendor only');
    }
    const body = z
      .object({
        title: z.string().optional(),
        discountPct: z.number().int().min(1).max(90).optional(),
        isActive: z.boolean().optional(),
        endsAt: z.string().datetime().optional(),
      })
      .parse(req.body);

    const sale = await prisma.flashSale.update({
      where: { id: String(req.params.id) },
      data: {
        ...body,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      },
    });
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

export default router;
