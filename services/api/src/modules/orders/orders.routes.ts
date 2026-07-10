import { Router, Request, Response, NextFunction } from 'express';
import { createOrder, getOrdersByCustomer, getOrderById, updateOrderStatus } from './orders.service.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { OrderStatus } from '@prisma/client';

const router = Router();

// Get customer's orders
router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const orders = await getOrdersByCustomer(userId);
    res.json({ success: true, data: { items: orders } });
  } catch (err) {
    next(err);
  }
});

// Create new order
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { vendorId, paymentMethod, deliveryAddressId, deliveryAddress, specialInstructions, items } = req.body;

    const order = await createOrder({
      customerId: userId,
      vendorId,
      paymentMethod,
      deliveryAddressId,
      deliveryAddress,
      specialInstructions,
      items,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// Update order status (would normally be restricted to vendors/drivers/admins)
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(req.params.id, status as OrderStatus);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
