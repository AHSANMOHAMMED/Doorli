import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
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

/** Constant-time string compare that never short-circuits on length. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison to keep timing uniform, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function requireErpSecret(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing ERP Secret' });
  }

  const secret = authHeader.slice('Bearer '.length).trim();
  if (!safeEqual(secret, erpSecretExpected())) {
    return res.status(403).json({ error: 'Invalid ERP Secret' });
  }
  next();
}

/** Statuses that must not be overwritten by a later, out-of-order callback. */
const TERMINAL_STATUSES: ReadonlySet<MarketplaceStatus> = new Set<MarketplaceStatus>([
  'delivered',
  'cancelled',
]);

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
  const { marketplace_order_id, erp_order_id, status } = req.body;

  if ((!marketplace_order_id && !erp_order_id) || !status) {
    return res.status(400).json({ error: 'Invalid payload: require status and an order id' });
  }

  const newStatus = mapErpStatusToMarketplace(String(status));
  if (!newStatus) {
    return res.status(400).json({ error: `Unsupported ERP status: ${status}` });
  }

  try {
    // Locate by marketplace id (primary) or by the persisted ERP order id.
    // Non-UUID marketplace ids (from smoke tests / bad clients) must not 500.
    let order = null;
    if (marketplace_order_id) {
      const id = String(marketplace_order_id);
      order = /^[0-9a-f-]{36}$/i.test(id)
        ? await prisma.order.findUnique({ where: { id } })
        : await prisma.order.findFirst({ where: { orderNumber: id } });
    } else if (erp_order_id) {
      order = await prisma.order.findFirst({ where: { erpOrderId: String(erp_order_id) } });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Idempotent: repeat callbacks with the same status are a no-op success.
    if (order.status === newStatus) {
      return res.json({ success: true, status: newStatus, idempotent: true });
    }

    // Do not resurrect or flip an order that already reached a terminal state.
    if (TERMINAL_STATUSES.has(order.status as MarketplaceStatus)) {
      return res.json({
        success: true,
        status: order.status,
        idempotent: true,
        ignored: `Order already ${order.status}`,
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
    console.log(`[ERP Webhook] Updated order ${order.id} to ${newStatus}`);
    return res.json({ success: true, status: newStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Order status update error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
