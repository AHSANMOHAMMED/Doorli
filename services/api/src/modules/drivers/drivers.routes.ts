import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
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

export default driversRouter;
