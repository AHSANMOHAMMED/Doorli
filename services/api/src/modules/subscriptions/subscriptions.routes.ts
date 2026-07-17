import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const subscriptionsRouter = Router();
subscriptionsRouter.use(authenticateToken);

const createSchema = z.object({
  vendorId: z.string().uuid(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    }),
  ),
  deliveryAddress: z.string().min(5),
  nextDeliveryAt: z.string().datetime().optional(),
});

subscriptionsRouter.get('/my', async (req, res, next) => {
  try {
    const subs = await prisma.deliverySubscription.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: subs });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const nextDelivery =
      input.nextDeliveryAt != null
        ? new Date(input.nextDeliveryAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sub = await prisma.deliverySubscription.create({
      data: {
        customerId: req.user!.id,
        vendorId: input.vendorId,
        frequency: input.frequency,
        items: input.items,
        deliveryAddress: input.deliveryAddress,
        nextDeliveryAt: nextDelivery,
      },
    });
    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const existing = await prisma.deliverySubscription.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.customerId !== req.user!.id) throw new AppError(404, 'Not found');
    const sub = await prisma.deliverySubscription.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

/** Process due subscriptions into orders (called by cron / admin). */
subscriptionsRouter.post('/process-due', async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') throw new AppError(403, 'Admin only');
    const due = await prisma.deliverySubscription.findMany({
      where: { isActive: true, nextDeliveryAt: { lte: new Date() } },
      take: 50,
    });

    const created = [];
    for (const sub of due) {
      const items = sub.items as Array<{ productId: string; quantity: number; unitPrice: number }>;
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const deliveryFee = 300;
      const orderNumber = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: sub.customerId,
          vendorId: sub.vendorId,
          paymentMethod: 'cod',
          specialInstructions: `Subscription ${sub.frequency}`,
          subtotal,
          deliveryFee,
          totalAmount: subtotal + deliveryFee,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.unitPrice * i.quantity,
            })),
          },
        },
      });

      const days = sub.frequency === 'monthly' ? 30 : sub.frequency === 'biweekly' ? 14 : 7;
      await prisma.deliverySubscription.update({
        where: { id: sub.id },
        data: { nextDeliveryAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000) },
      });
      created.push(order.id);
    }

    res.json({ success: true, data: { processed: created.length, orderIds: created } });
  } catch (err) {
    next(err);
  }
});

export default subscriptionsRouter;
