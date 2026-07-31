import { Router, Request, Response, NextFunction } from 'express';
import {
  createOrder,
  getOrdersByCustomer,
  getOrderById,
  updateOrderStatus,
  getOrdersForVendorUser,
  cancelOrder,
  getDriverJobs,
  estimateDeliveryFee,
} from './orders.service.js';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { getCachedDriverLocation } from '../drivers/drivers.service.js';
import { OrderStatus } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { getDispatchService } from '../../lib/dispatch.js';

const router = Router();

/**
 * Internal: the API service's ERP dispatch-delivery webhook (Req 11.4) creates
 * a ready `pos` order and asks us to run the dispatch engine for it.
 * Guarded by the shared ERP internal secret, not a user JWT.
 */
router.post('/internal/dispatch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expected = process.env.ERP_INTERNAL_SECRET || 'doorli_internal_sync_secret';
    const given = req.headers['x-internal-secret'];
    if (typeof given !== 'string' || given !== expected) {
      res.status(403).json({ success: false, error: 'Invalid internal secret' });
      return;
    }
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';
    if (!orderId) throw new AppError(400, 'orderId is required');
    await getDispatchService().dispatchOrder(orderId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const { items, nextCursor } = await getOrdersByCustomer(userId, { cursor, limit });
    res.json({ success: true, data: { items, nextCursor } });
  } catch (err) {
    next(err);
  }
});

router.get('/vendor/mine', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      res.status(403).json({ success: false, error: 'Vendor only' });
      return;
    }
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const { items, nextCursor } = await getOrdersForVendorUser(req.user.id, { cursor, limit });
    res.json({ success: true, data: { items, nextCursor } });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/driver',
  authenticateToken,
  requireRole('driver', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobs = await getDriverJobs(req.user!.id);
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/estimate-fee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = String(req.query.vendorId || '');
    const lat = req.query.lat != null ? Number(req.query.lat) : null;
    const lng = req.query.lng != null ? Number(req.query.lng) : null;
    if (!vendorId) throw new AppError(400, 'vendorId required');
    const fee = await estimateDeliveryFee(vendorId, lat, lng);
    res.json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/track', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    // Live driver position from Redis cache (falls back to last DB fix)
    const driverLocation = order.driver
      ? await getCachedDriverLocation(order.driver.id)
      : null;
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        vendor: order.vendor,
        deliveryAddress: order.deliveryAddress,
        driver: order.driver,
        driverLocation,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { vendorId, paymentMethod, deliveryAddressId, deliveryAddress, specialInstructions, items, promoCode } =
      req.body;

    const order = await createOrder({
      customerId: userId,
      vendorId,
      paymentMethod,
      deliveryAddressId,
      deliveryAddress,
      specialInstructions,
      items,
      promoCode,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    const { status } = req.body;
    const order = await updateOrderStatus(String(req.params.id), status as OrderStatus, {
      id: req.user.id,
      role: req.user.role,
    });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    const order = await cancelOrder(String(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
