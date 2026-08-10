import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../middleware/errorHandler.js';
import { toggleOnlineSchema, updateLocationSchema } from './drivers.schema.js';
import * as driversService from './drivers.service.js';

const driversRouter = Router();
const documentTypes = new Set([
  'driver_license',
  'vehicle_registration',
  'insurance_certificate',
  'vehicle_photo',
]);

function periodStart(period: unknown): Date | undefined {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return undefined;
}

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

driversRouter.get('/me/profile', async (req, res, next) => {
  try {
    res.json({ success: true, data: await driversService.getDriverProfile(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

driversRouter.get('/me/vehicle', async (req, res, next) => {
  try {
    res.json({ success: true, data: await driversService.getDriverVehicle(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

driversRouter.get('/me/stats', async (req, res, next) => {
  try {
    res.json({ success: true, data: await driversService.getDriverStats(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

driversRouter.get(['/me/trips', '/me/history'], async (req, res, next) => {
  try {
    const items = await driversService.getDriverTrips(req.user!.id, periodStart(req.query.period));
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

driversRouter.get('/me/documents', async (req, res, next) => {
  try {
    res.json({ success: true, data: await driversService.getDriverDocuments(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

driversRouter.post('/me/documents', async (req, res, next) => {
  try {
    const type = String(req.body?.type || '');
    const url = String(req.body?.url || '');
    if (!documentTypes.has(type)) throw new AppError(400, 'Unsupported document type');
    try {
      new URL(url);
    } catch {
      throw new AppError(400, 'A valid document URL is required');
    }
    const document = await driversService.saveDriverDocument(req.user!.id, type, url);
    res.status(201).json({ success: true, data: document });
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

// Spec aliases (Req 4.2): explicit availability endpoints
driversRouter.patch('/go-online', async (req, res, next) => {
  try {
    const driver = await driversService.setOnlineStatus(req.user!.id, true);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

driversRouter.patch('/go-offline', async (req, res, next) => {
  try {
    const driver = await driversService.setOnlineStatus(req.user!.id, false);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

// Spec alias (Req 4.3) for PATCH /me/location
driversRouter.patch('/update-location', validateBody(updateLocationSchema), async (req, res, next) => {
  try {
    const driver = await driversService.updateLocation(req.user!.id, req.body);
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
