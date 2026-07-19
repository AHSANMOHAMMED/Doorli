import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  getNearbyVendors,
  getVendorByUserId,
} from './vendors.service.js';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { createVendorSchema, nearbyVendorsSchema, updateVendorSchema } from './vendors.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/nearby', validateQuery(nearbyVendorsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius, category } = req.query as unknown as {
      lat: number;
      lng: number;
      radius: number;
      category?: string;
    };
    const vendors = await getNearbyVendors({ lat, lng, radius, category });
    res.json({ success: true, data: { items: vendors } });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const vendors = await getAllVendors(category as string | undefined);
    res.json({ success: true, data: { items: vendors } });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/me',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await getVendorByUserId(req.user.id);
      if (!vendor) {
        res.status(404).json({ success: false, error: 'Vendor profile not found' });
        return;
      }
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(createVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await createVendor(req.user.id, req.body);
      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(updateVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const vendor = await updateVendor(req.params.id as string, req.user.id, req.user.role, req.body);
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
