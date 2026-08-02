import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const corporateRouter = Router();
corporateRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

corporateRouter.post('/', async (req, res, next) => {
  try {
    const body = z.object({
      companyName: z.string().min(1),
      companyEmail: z.string().email(),
      contactPhone: z.string().min(1),
      addressLine: z.string().optional(),
      city: z.string().optional(),
      taxId: z.string().optional(),
      creditLimit: z.number().min(0).optional(),
    }).parse(req.body);

    const existing = await prisma.corporateAccount.findUnique({
      where: { companyEmail: body.companyEmail },
    });
    if (existing) throw new AppError(409, 'Company email already registered');

    const account = await prisma.corporateAccount.create({
      data: {
        companyName: body.companyName,
        companyEmail: body.companyEmail,
        contactPhone: body.contactPhone,
        addressLine: body.addressLine,
        city: body.city,
        taxId: body.taxId,
        creditLimit: body.creditLimit ?? 0,
        status: 'pending',
      },
    });

    await prisma.corporateUser.create({
      data: {
        corporateId: account.id,
        userId: req.user!.id as string,
        role: 'admin',
      },
    });

    res.status(201).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

corporateRouter.get('/', async (req, res, next) => {
  try {
    const corporateUser = await prisma.corporateUser.findFirst({
      where: { userId: req.user!.id as string },
      include: { corporate: true },
    });
    if (!corporateUser) throw new AppError(404, 'No corporate account found');
    res.json({ success: true, data: corporateUser.corporate });
  } catch (err) {
    next(err);
  }
});

corporateRouter.get('/all', async (req, res, next) => {
  try {
    requireAdmin(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const accounts = await prisma.corporateAccount.findMany({
      where: status ? { status } : undefined,
      include: { users: { include: { user: { select: { id: true, fullName: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
});

corporateRouter.patch('/:id/approve', async (req, res, next) => {
  try {
    requireAdmin(req);
    const account = await prisma.corporateAccount.update({
      where: { id: req.params.id },
      data: {
        status: 'active',
        approvedBy: req.user!.id as string,
      },
    });
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

corporateRouter.patch('/:id/reject', async (req, res, next) => {
  try {
    requireAdmin(req);
    const account = await prisma.corporateAccount.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        approvedBy: req.user!.id as string,
      },
    });
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});

corporateRouter.post('/:id/users', async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = z.object({
      userId: z.string().uuid(),
      role: z.enum(['admin', 'manager', 'member']).default('member'),
      department: z.string().optional(),
      monthlyLimit: z.number().min(0).optional(),
    }).parse(req.body);

    const existing = await prisma.corporateUser.findUnique({
      where: { corporateId_userId: { corporateId: req.params.id, userId: body.userId } },
    });
    if (existing) throw new AppError(409, 'User already in this corporate account');

    const corporateUser = await prisma.corporateUser.create({
      data: {
        corporateId: req.params.id,
        userId: body.userId,
        role: body.role,
        department: body.department,
        monthlyLimit: body.monthlyLimit,
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    res.status(201).json({ success: true, data: corporateUser });
  } catch (err) {
    next(err);
  }
});

corporateRouter.delete('/:id/users/:userId', async (req, res, next) => {
  try {
    requireAdmin(req);
    await prisma.corporateUser.delete({
      where: {
        corporateId_userId: { corporateId: req.params.id, userId: req.params.userId },
      },
    });
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    next(err);
  }
});

corporateRouter.get('/:id/users', async (req, res, next) => {
  try {
    requireAdmin(req);
    const users = await prisma.corporateUser.findMany({
      where: { corporateId: req.params.id },
      include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

corporateRouter.get('/:id/orders', async (req, res, next) => {
  try {
    requireAdmin(req);
    const orders = await prisma.order.findMany({
      where: { corporateId: req.params.id },
      include: {
        vendor: { select: { businessName: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

corporateRouter.get('/:id/credit', async (req, res, next) => {
  try {
    requireAdmin(req);
    const account = await prisma.corporateAccount.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        companyName: true,
        creditLimit: true,
        creditUsed: true,
        status: true,
      },
    });
    if (!account) throw new AppError(404, 'Corporate account not found');
    const available = Number(account.creditLimit) - Number(account.creditUsed);
    res.json({
      success: true,
      data: {
        ...account,
        creditLimit: Number(account.creditLimit),
        creditUsed: Number(account.creditUsed),
        availableCredit: available,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default corporateRouter;
