import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@doorli/db';

const router = Router();

type MarketplaceStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

function erpSecretExpected(): string {
  return (process.env.ERP_INTERNAL_SECRET || 'doorli_internal_sync_secret').replace(/^Bearer\s+/i, '');
}

function requireErpSecret(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing ERP Secret' });
  }

  const secret = authHeader.slice('Bearer '.length).trim();
  if (secret !== erpSecretExpected()) {
    return res.status(403).json({ error: 'Invalid ERP Secret' });
  }
  next();
}

/** Map Enterprise/ERP status strings onto marketplace OrderStatus. */
function mapErpStatusToMarketplace(status: string): MarketplaceStatus | null {
  const key = status.trim().toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, MarketplaceStatus> = {
    pending: 'pending',
    confirmed: 'confirmed',
    preparing: 'preparing',
    ready: 'ready',
    picked_up: 'picked_up',
    to_deliver: 'picked_up',
    completed: 'delivered',
    delivered: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    closed: 'delivered',
  };
  return map[key] ?? null;
}

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Stock update error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/order-status', requireErpSecret, async (req: Request, res: Response) => {
  const { marketplace_order_id, status } = req.body;

  if (!marketplace_order_id || !status) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const newStatus = mapErpStatusToMarketplace(String(status));
  if (!newStatus) {
    return res.status(400).json({ error: `Unsupported ERP status: ${status}` });
  }

  try {
    await prisma.order.update({
      where: { id: marketplace_order_id },
      data: { status: newStatus },
    });
    console.log(`[ERP Webhook] Updated order ${marketplace_order_id} to ${newStatus}`);
    return res.json({ success: true, status: newStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Order status update error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
