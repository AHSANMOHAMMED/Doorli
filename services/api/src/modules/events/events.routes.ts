import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const eventsRouter = Router();
eventsRouter.use(authenticateToken);

const createSchema = z.object({
  title: z.string().min(3).max(200),
  eventDate: z.string(),
  guestCount: z.number().int().positive().optional(),
  venueVendorId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        role: z.enum(['venue', 'catering', 'decoration', 'photography', 'entertainment', 'other']),
        vendorId: z.string().uuid().optional(),
        label: z.string(),
        estimatedCost: z.number().optional(),
      }),
    )
    .optional(),
});

eventsRouter.get('/my', async (req, res, next) => {
  try {
    const packages = await prisma.eventPackage.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
});

eventsRouter.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const items = input.items ?? [];
    const totalEstimate = items.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
    const pkg = await prisma.eventPackage.create({
      data: {
        customerId: req.user!.id,
        title: input.title,
        eventDate: new Date(input.eventDate),
        guestCount: input.guestCount,
        venueVendorId: input.venueVendorId,
        items,
        totalEstimate,
        status: 'draft',
      },
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

eventsRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.eventPackage.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.customerId !== req.user!.id) throw new AppError(404, 'Not found');

    const body = z
      .object({
        title: z.string().optional(),
        guestCount: z.number().int().optional(),
        venueVendorId: z.string().uuid().nullable().optional(),
        items: z.array(z.any()).optional(),
        status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
      })
      .parse(req.body);

    const totalEstimate = body.items
      ? body.items.reduce((s: number, i: { estimatedCost?: number }) => s + (i.estimatedCost ?? 0), 0)
      : undefined;

    const pkg = await prisma.eventPackage.update({
      where: { id: req.params.id },
      data: {
        ...body,
        totalEstimate,
      },
    });
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

export default eventsRouter;
