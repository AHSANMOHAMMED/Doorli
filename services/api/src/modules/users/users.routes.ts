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

export default usersRouter;
