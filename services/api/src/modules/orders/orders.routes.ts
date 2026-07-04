import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { paramId } from '../../lib/params.js';
import {
  createOrderSchema,
  previewOrderSchema,
  updateOrderStatusSchema,
} from './orders.schema.js';
import * as ordersService from './orders.service.js';

const ordersRouter = Router();

ordersRouter.use(authenticateToken);

ordersRouter.post('/preview', validateBody(previewOrderSchema), async (req, res, next) => {
  try {
    const preview = await ordersService.previewOrder(req.body);
    res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post(
  '/',
  requireRole('customer', 'admin'),
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const order = await ordersService.createOrder(req.user!.id, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },
);

ordersRouter.get('/my', requireRole('customer', 'admin'), async (req, res, next) => {
  try {
    const orders = await ordersService.listCustomerOrders(req.user!.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/vendor', requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const orders = await ordersService.listVendorOrders(
      req.user!.id,
      status as Parameters<typeof ordersService.listVendorOrders>[1],
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/driver', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const orders = await ordersService.listDriverOrders(req.user!.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id/track', async (req, res, next) => {
  try {
    const track = await ordersService.getOrderTrack(
      paramId(req.params.id),
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: track });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/:id/accept', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const order = await ordersService.acceptOrder(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/:id/decline', requireRole('driver', 'admin'), async (req, res, next) => {
  try {
    const result = await ordersService.declineOrder(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(
      paramId(req.params.id),
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/:id/cancel', requireRole('customer', 'admin'), async (req, res, next) => {
  try {
    const order = await ordersService.cancelOrder(paramId(req.params.id), req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch(
  '/:id/status',
  requireRole('vendor', 'driver', 'admin'),
  validateBody(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      const order = await ordersService.updateOrderStatus(
        paramId(req.params.id),
        req.user!.id,
        req.user!.role,
        req.body.status,
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },
);

export default ordersRouter;
