import { Router } from 'express';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const citiesRouter = Router();

citiesRouter.get('/', async (_req, res, next) => {
  try {
    const zones = await prisma.geographicZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, demandLevel: true },
      orderBy: { name: 'asc' },
    });

    // Fallback curated cities if no zones seeded
    if (!zones.length) {
      res.json({
        success: true,
        data: [
          { id: 'colombo', name: 'Colombo', city: 'Colombo', demandLevel: 3 },
          { id: 'kandy', name: 'Kandy', city: 'Kandy', demandLevel: 2 },
          { id: 'galle', name: 'Galle', city: 'Galle', demandLevel: 2 },
          { id: 'jaffna', name: 'Jaffna', city: 'Jaffna', demandLevel: 1 },
        ],
      });
      return;
    }

    res.json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
});

citiesRouter.get('/:city/vendors', async (req, res, next) => {
  try {
    const city = req.params.city;
    const vendors = await prisma.vendor.findMany({
      where: {
        isOpen: true,
        OR: [
          { city: { equals: city, mode: 'insensitive' } },
          { addressLine: { contains: city, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { avgRating: 'desc' },
    });
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
});

citiesRouter.post('/seed-defaults', authenticateToken, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin only' });
      return;
    }
    const defaults = [
      { name: 'Colombo Central', city: 'Colombo', demandLevel: 3 },
      { name: 'Kandy City', city: 'Kandy', demandLevel: 2 },
      { name: 'Galle Fort', city: 'Galle', demandLevel: 2 },
      { name: 'Jaffna Town', city: 'Jaffna', demandLevel: 1 },
    ];
    for (const z of defaults) {
      const exists = await prisma.geographicZone.findFirst({ where: { name: z.name } });
      if (!exists) await prisma.geographicZone.create({ data: z });
    }
    res.json({ success: true, data: { seeded: true } });
  } catch (err) {
    next(err);
  }
});

export default citiesRouter;
