import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../middleware/errorHandler.js';
import { toggleOnlineSchema, updateLocationSchema } from './drivers.schema.js';
import * as driversService from './drivers.service.js';

const driversRouter = Router();

driversRouter.use(authenticateToken, requireRole('driver', 'admin'));

driversRouter.get('/me', async (req, res, next) => {
  try {
    const driver = await driversService.getDriverProfile(req.user!.id);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

driversRouter.get('/me/earnings', async (req, res, next) => {
  try {
    const earnings = await driversService.getEarnings(req.user!.id);
    res.json({ success: true, data: earnings });
  } catch (err) {
    next(err);
  }
});

driversRouter.patch('/me/online', validateBody(toggleOnlineSchema), async (req, res, next) => {
  try {
    const driver = await driversService.toggleOnline(req.user!.id, req.body);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

driversRouter.patch('/me/location', validateBody(updateLocationSchema), async (req, res, next) => {
  try {
    const driver = await driversService.updateLocation(req.user!.id, req.body);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

driversRouter.patch('/accept-delivery/:orderId', async (req, res, next) => {
  try {
    const order = await driversService.acceptDelivery(String(req.params.orderId), req.user!.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err instanceof Error ? new AppError(400, err.message) : err);
  }
});

driversRouter.patch('/decline-delivery/:orderId', async (req, res, next) => {
  try {
    const result = await driversService.declineDelivery(String(req.params.orderId), req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err instanceof Error ? new AppError(400, err.message) : err);
  }
});

export default driversRouter;
