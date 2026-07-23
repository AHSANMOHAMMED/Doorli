import { Router, Request, Response } from 'express';
import { prisma } from '@doorli/db';

const router = Router();
const ERP_INTERNAL_SECRET = process.env.ERP_INTERNAL_SECRET || 'doorli_internal_sync_secret';

// Basic middleware to ensure only the internal ERP can hit these webhooks
function requireErpSecret(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing ERP Secret' });
  }

  const secret = authHeader.split(' ')[1];
  if (secret !== ERP_INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Invalid ERP Secret' });
  }
  next();
}

/**
 * POST /api/v1/erp-webhooks/stock-update
 * Called by the ERP when inventory changes (e.g., POS sale or manual adjustment)
 */
router.post('/stock-update', requireErpSecret, async (req: Request, res: Response) => {
  const { productId, newStockQuantity } = req.body;

  if (!productId || typeof newStockQuantity !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: newStockQuantity },
    });
    console.log(`[ERP Webhook] Updated stock for product ${productId} to ${newStockQuantity}`);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('[ERP Webhook] Stock update error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
