import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createAddressSchema } from './users.schema.js';

const usersRouter = Router();

usersRouter.use(authenticateToken);

usersRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        profilePhotoUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
});

usersRouter.post(
  '/addresses',
  validateBody(createAddressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.id },
          data: { isDefault: false },
        });
      }
      const address = await prisma.address.create({
        data: { userId: req.user!.id, ...req.body },
      });
      res.status(201).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  },
);

usersRouter.patch('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.address.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new AppError(404, 'Address not found');
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.update({
      where: { id },
      data: {
        label: req.body.label ?? undefined,
        addressLine: req.body.addressLine ?? undefined,
        city: req.body.city ?? undefined,
        latitude: req.body.latitude ?? undefined,
        longitude: req.body.longitude ?? undefined,
        isDefault: req.body.isDefault ?? undefined,
      },
    });
    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
});

usersRouter.delete('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const result = await prisma.address.deleteMany({ where: { id, userId: req.user!.id } });
    if (!result.count) throw new AppError(404, 'Address not found');
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName: req.body.fullName ?? undefined,
        email: req.body.email ?? undefined,
        profilePhotoUrl: req.body.profilePhotoUrl ?? undefined,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        profilePhotoUrl: true,
        isVerified: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/device-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.body.token || '');
    const platform = String(req.body.platform || 'android');
    if (!token) throw new AppError(400, 'token required');

    const device = await prisma.deviceToken.upsert({
      where: { token },
      create: { userId: req.user!.id, token, platform },
      update: { userId: req.user!.id, platform },
    });
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/notifications/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, data: { updated: n.count } });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: { updated: n.count } });
  } catch (err) {
    next(err);
  }
});

export default usersRouter;
