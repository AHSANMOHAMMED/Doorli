import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { paramId } from '../../lib/params.js';
import {
  createProductSchema,
  updateProductSchema,
  bulkStockUpdateSchema,
} from './products.schema.js';
import * as productsService from './products.service.js';

const productsRouter = Router();

productsRouter.get(
  '/my',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req, res, next) => {
    try {
      const products = await productsService.listMyProducts(req.user!.id);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.post(
  '/',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(createProductSchema),
  async (req, res, next) => {
    try {
      const product = await productsService.createProduct(req.user!.id, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.post(
  '/bulk-update-stock',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(bulkStockUpdateSchema),
  async (req, res, next) => {
    try {
      const products = await productsService.bulkUpdateStock(req.user!.id, req.body.updates);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await productsService.getProductById(paramId(req.params.id));
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

productsRouter.patch(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(updateProductSchema),
  async (req, res, next) => {
    try {
      const product = await productsService.updateProduct(paramId(req.params.id), req.user!.id, req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.patch(
  '/:id/toggle-available',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req, res, next) => {
    try {
      const product = await productsService.toggleProductAvailability(paramId(req.params.id), req.user!.id);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

productsRouter.delete(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await productsService.deleteProduct(paramId(req.params.id), req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default productsRouter;
