import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const supportRouter = Router();
supportRouter.use(authenticateToken);

function requireAdmin(req: { user?: { role?: string } }) {
  if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
}

supportRouter.post('/tickets', async (req, res, next) => {
  try {
    const body = z.object({
      subject: z.string().min(1).max(200),
      description: z.string().min(1),
      category: z.string().default('general'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    }).parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.id as string,
        subject: body.subject,
        description: body.description,
        category: body.category,
        priority: body.priority,
      },
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

supportRouter.get('/tickets', async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const where: any = isAdmin ? {} : { userId: req.user!.id as string };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          responses: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: tickets,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

supportRouter.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        responses: {
          include: { sender: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new AppError(404, 'Ticket not found');

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && ticket.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

supportRouter.post('/tickets/:id/respond', async (req, res, next) => {
  try {
    const body = z.object({
      message: z.string().min(1),
      isInternal: z.boolean().default(false),
    }).parse(req.body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) throw new AppError(404, 'Ticket not found');

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && ticket.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    const response = await prisma.ticketResponse.create({
      data: {
        ticketId: req.params.id,
        senderId: req.user!.id as string,
        message: body.message,
        isInternal: isAdmin ? body.isInternal : false,
      },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (isAdmin && ticket.status === 'open') {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'in_progress' },
      });
    }

    res.status(201).json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

supportRouter.patch('/tickets/:id/status', async (req, res, next) => {
  try {
    requireAdmin(req);

    const body = z.object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    }).parse(req.body);

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });

    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

supportRouter.patch('/tickets/:id/assign', async (req, res, next) => {
  try {
    requireAdmin(req);

    const body = z.object({
      assignedTo: z.string().nullable(),
    }).parse(req.body);

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { assignedTo: body.assignedTo },
    });

    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

export default supportRouter;
