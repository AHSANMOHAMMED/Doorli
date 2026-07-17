import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const adminRouter = Router();
adminRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

adminRouter.get('/stats', async (req, res, next) => {
  try {
    requireAdmin(req);
    const [vendors, pendingVendors, driversOnline, ordersToday, revenue] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isVerified: false } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalVendors: vendors,
        pendingKyc: pendingVendors,
        activeDrivers: driversOnline,
        ordersToday,
        revenue30d: Number(revenue._sum.totalAmount ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/vendors', async (req, res, next) => {
  try {
    requireAdmin(req);
    const verified = req.query.verified;
    const vendors = await prisma.vendor.findMany({
      where: verified === 'false' ? { isVerified: false } : undefined,
      include: { user: { select: { phone: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/vendors/:id/verify', async (req, res, next) => {
  try {
    requireAdmin(req);
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/drivers', async (req, res, next) => {
  try {
    requireAdmin(req);
    const drivers = await prisma.driver.findMany({
      include: { user: { select: { fullName: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/orders', async (req, res, next) => {
  try {
    requireAdmin(req);
    const orders = await prisma.order.findMany({
      include: {
        vendor: { select: { businessName: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    requireAdmin(req);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z
      .object({
        isActive: z.boolean().optional(),
        isVerified: z.boolean().optional(),
        role: z.enum(['customer', 'vendor', 'driver', 'admin']).optional(),
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
