import { Router, Request, Response, NextFunction } from 'express';
import {
  getProductsByVendor,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.service.js';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/vendor/:vendorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await getProductsByVendor(req.params.vendorId as string);
    res.json({ success: true, data: { items: products } });
  } catch (err) {
    next(err);
  }
});

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
