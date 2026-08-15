import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import type { Prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);
const profileSchema = z.object({
  name: z.string().min(2).max(100),
  relationship: z.string().min(2).max(40),
  phone: z.string().min(7).max(20).optional(),
  dateOfBirth: z.string().date().optional(),
  preferences: z.record(z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});

router.get('/', async (req, res, next) => {
  try { res.json({ success: true, data: await prisma.familyProfile.findMany({ where: { userId: req.user!.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }) }); } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const profile = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.familyProfile.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
      return tx.familyProfile.create({ data: { ...body, userId: req.user!.id, dateOfBirth: body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00.000Z`) : undefined, preferences: body.preferences as Prisma.InputJsonValue | undefined } });
    });
    res.status(201).json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = profileSchema.partial().parse(req.body);
    const existing = await prisma.familyProfile.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) throw new AppError(404, 'Family profile not found');
    const profile = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.familyProfile.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
      return tx.familyProfile.update({ where: { id: existing.id }, data: { ...body, dateOfBirth: body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00.000Z`) : undefined, preferences: body.preferences as Prisma.InputJsonValue | undefined } });
    });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await prisma.familyProfile.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    if (!deleted.count) throw new AppError(404, 'Family profile not found');
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
