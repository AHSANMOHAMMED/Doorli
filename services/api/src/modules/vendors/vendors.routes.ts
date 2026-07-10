import { Router, Request, Response, NextFunction } from 'express';
import { getAllVendors, getVendorById, createVendor, updateVendor } from './vendors.service.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const vendors = await getAllVendors(category as string);
    res.json({ success: true, data: { items: vendors } });
  } catch (err) {
    next(err);
  }
});

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

router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic implementation: tie to logged-in user
    const data = { ...req.body, userId: req.user?.id };
    const vendor = await createVendor(data);
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await updateVendor(req.params.id as string, req.body);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

export default router;
