import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { paramId } from '../../lib/params.js';
import {
  createVendorSchema,
  updateVendorSchema,
  nearbyVendorsSchema,
  listVendorsSchema,
} from './vendors.schema.js';
import * as vendorsService from './vendors.service.js';

const vendorsRouter = Router();

vendorsRouter.get('/', validateQuery(listVendorsSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as {
      category?: string;
      page: number;
      pageSize: number;
    };
    const result = await vendorsService.listVendors(query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.get('/nearby', validateQuery(nearbyVendorsSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as {
      lat: number;
      lng: number;
      radius: number;
      category?: string;
    };
    const result = await vendorsService.findNearbyVendors(query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.get('/me/shop', authenticateToken, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const vendor = await vendorsService.getMyVendor(req.user!.id);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.post(
  '/',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(createVendorSchema),
  async (req, res, next) => {
    try {
      const vendor = await vendorsService.createVendor(req.user!.id, req.body);
      res.status(201).json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

vendorsRouter.get('/:id', async (req, res, next) => {
  try {
    const vendor = await vendorsService.getVendorById(paramId(req.params.id));
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.get('/:id/products', async (req, res, next) => {
  try {
    const products = await vendorsService.getVendorProducts(paramId(req.params.id));
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.patch(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(updateVendorSchema),
  async (req, res, next) => {
    try {
      const vendor = await vendorsService.updateVendor(paramId(req.params.id), req.user!.id, req.body);
      res.json({ success: true, data: vendor });
    } catch (err) {
      next(err);
    }
  },
);

vendorsRouter.patch(
  '/:id/toggle-status',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await vendorsService.toggleVendorStatus(paramId(req.params.id), req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default vendorsRouter;
