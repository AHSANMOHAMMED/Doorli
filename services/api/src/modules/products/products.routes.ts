import { Router, Request, Response, NextFunction } from 'express';
import { getProductsByVendor, getProductById, createProduct, updateProduct } from './products.service.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

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

router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await updateProduct(req.params.id as string, req.body);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

export default router;
