import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllProducts,
  getProductsByVendor,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailable,
  bulkUpdateStock,
} from './products.service.js';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { validateBody } from '../../middleware/validate.js';
import { bulkStockUpdateSchema } from './products.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// ─── Static / non-param routes first ─────────────────────────────────────────

// Public endpoint to list products — optional vendorId filter (Req 9.4)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.query.vendorId as string | undefined;
    const products = await getAllProducts(vendorId);
    res.json({ success: true, data: { items: products } });
  } catch (err) {
    next(err);
  }
});

router.get('/vendor/:vendorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await getProductsByVendor(req.params.vendorId as string);
    res.json({ success: true, data: { items: products } });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const product = await createProduct(req.user.id, req.user.role, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /products/bulk-update-stock
 * Body: { updates: [{productId, stockQuantity}] }
 * Runs in a Prisma transaction; enqueues low-stock notifications (Req 9.4, 9.11).
 * Must be registered before /:id routes to avoid param collision.
 */
router.post(
  '/bulk-update-stock',
  authenticateToken,
  requireRole('vendor', 'admin'),
  validateBody(bulkStockUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const { updates } = req.body as { updates: Array<{ productId: string; stockQuantity: number }> };
      const products = await bulkUpdateStock(updates, req.user.id, req.user.role);
      res.json({ success: true, data: { updated: products.length, products } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Param routes ─────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await getProductById(req.params.id as string);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /products/:id/toggle-available
 * Flip isAvailable boolean (vendor/admin only) (Req 2.8).
 * Must be registered before PATCH /:id to take priority.
 */
router.patch(
  '/:id/toggle-available',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const product = await toggleProductAvailable(req.params.id as string, req.user.id, req.user.role);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const product = await updateProduct(req.params.id as string, req.user.id, req.user.role, req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole('vendor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized');
      const product = await deleteProduct(req.params.id as string, req.user.id, req.user.role);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
