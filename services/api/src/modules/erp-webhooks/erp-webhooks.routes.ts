import { Router, Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@doorli/db';
import { isFeatureEnabled, DOORLI_DELIVERY_KEY } from '../../lib/featureFlags.js';
import { recordIntegrationFailure } from '../../lib/integrationFailures.js';

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
  if (!process.env.ERP_INTERNAL_SECRET) {
    throw new Error('ERP_INTERNAL_SECRET environment variable is required');
  }
  return process.env.ERP_INTERNAL_SECRET.replace(/^Bearer\s+/i, '');
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

function hasValidWebhookSignature(req: Request): boolean {
  const timestamp = Number(req.headers['x-doorli-timestamp']);
  const provided = String(req.headers['x-doorli-signature'] || '').replace(/^sha256=/i, '').trim();
  if (!Number.isFinite(timestamp) || !provided || Math.abs(Date.now() - timestamp * 1000) > 5 * 60 * 1000) {
    return false;
  }
  const payload = `${timestamp}.${JSON.stringify(req.body ?? {})}`;
  const expected = createHmac('sha256', erpSecretExpected()).update(payload).digest('hex');
  return safeEqual(provided, expected);
}

function requireErpSecret(req: Request, res: Response, next: NextFunction) {
  if (hasValidWebhookSignature(req)) return next();

  // Legacy bearer auth remains available only for local/test callers. Production
  // traffic must include a timestamped HMAC to prevent replay attacks.
  if (process.env.NODE_ENV === 'production') {
    return res.status(req.headers.authorization ? 403 : 401).json({ error: 'Replay-safe webhook signature required' });
  }

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
    processing: 'preparing',
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
  const { productId, erp_tenant_id, sku, barcode, newStockQuantity } = req.body;

  if (typeof newStockQuantity !== 'number' || !Number.isFinite(newStockQuantity) || newStockQuantity < 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    let resolvedProductId = productId ? String(productId) : null;
    if (!resolvedProductId && erp_tenant_id && (sku || barcode)) {
      const vendor = await prisma.vendor.findFirst({ where: { erpTenantId: String(erp_tenant_id) }, select: { id: true } });
      if (vendor) {
        const matched = sku
          ? await prisma.product.findFirst({ where: { vendorId: vendor.id, sku: String(sku) }, select: { id: true } })
          : await prisma.product.findFirst({ where: { vendorId: vendor.id, barcode: String(barcode) }, select: { id: true } });
        resolvedProductId = matched?.id ?? null;
      }
    }
    if (!resolvedProductId) {
      if (!productId && !(erp_tenant_id && (sku || barcode))) return res.status(400).json({ error: 'Invalid payload' });
      return res.status(404).json({ error: 'Product not found for ERP stock update' });
    }

    const updated = await prisma.product.update({
      where: { id: resolvedProductId },
      data: { stockQuantity: newStockQuantity },
    });
    console.log(`[ERP Webhook] Updated stock for product ${productId} to ${newStockQuantity}`);

    // Emit low-stock notification if quantity is at or below the threshold (Req 10.3)
    if (updated.stockQuantity <= updated.lowStockAt) {
      try {
        const vendor = await prisma.vendor.findUnique({
          where: { id: updated.vendorId },
          select: { userId: true },
        });

        if (vendor) {
          // Dynamic import to avoid circular dependency
          const { enqueueNotification } = await import('../../lib/notifications.js');
          void enqueueNotification({
            userId: vendor.userId,
            title: 'Low stock alert',
            body: `Product stock is low (${updated.stockQuantity} remaining)`,
            type: 'low_stock',
            data: { productId: updated.id, stockQuantity: updated.stockQuantity },
          }).catch((err: unknown) => {
            console.error('[ERP Webhook] low-stock notification failed:', err);
          });
        }
      } catch (notifErr) {
        // Never fail the webhook because of a notification error
        console.error('[ERP Webhook] low-stock notification error:', notifErr);
      }
    }

    return res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Stock update error:', message);
    await recordIntegrationFailure({
      kind: 'stock-update',
      dedupeKey: `stock:${req.body.erp_tenant_id || 'unknown'}:${req.body.sku || req.body.barcode || req.body.productId || 'unknown'}`,
      payload: req.body,
      error,
    }).catch((recordError) => console.error('[ERP Webhook] failed to record stock dead letter:', recordError));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/order-status', requireErpSecret, async (req: Request, res: Response) => {
  const { marketplace_order_id, erp_order_id, status, vendor_company } = req.body;

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
        ? await prisma.order.findFirst({ where: { id, ...(vendor_company ? { vendor: { erpTenantId: String(vendor_company) } } : {}) } })
        : await prisma.order.findFirst({ where: { orderNumber: id, ...(vendor_company ? { vendor: { erpTenantId: String(vendor_company) } } : {}) } });
    } else if (erp_order_id) {
      order = await prisma.order.findFirst({ where: { erpOrderId: String(erp_order_id), ...(vendor_company ? { vendor: { erpTenantId: String(vendor_company) } } : {}) } });
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
    await recordIntegrationFailure({
      kind: 'order-status',
      dedupeKey: `order-status:${req.body.marketplace_order_id || req.body.erp_order_id || 'unknown'}:${req.body.status || 'unknown'}`,
      payload: req.body,
      error,
    }).catch((recordError) => console.error('[ERP Webhook] failed to record order dead letter:', recordError));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /erp-webhooks/product-sync — receive product catalog from ERP.
 * Creates or updates marketplace products keyed by (vendorId + sku/barcode).
 */
router.post('/product-sync', requireErpSecret, async (req: Request, res: Response) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: products array is required' });
  }

  try {
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const {
          erp_tenant_id,
          erp_item_id,
          sku,
          barcode,
          name,
          description,
          price,
          unit,
          image_url,
          category,
          stock_quantity,
          is_active,
        } = product;

        if (!erp_tenant_id || !name) {
          failed++;
          errors.push(`Product ${erp_item_id || 'unknown'}: missing erp_tenant_id or name`);
          continue;
        }

        // Find the vendor by erpTenantId
        const vendor = await prisma.vendor.findFirst({
          where: { erpTenantId: erp_tenant_id },
          select: { id: true, userId: true },
        });

        if (!vendor) {
          failed++;
          errors.push(`Product ${erp_item_id || name}: no vendor found for erp_tenant_id ${erp_tenant_id}`);
          continue;
        }

        // Match product by (vendorId + sku) or (vendorId + barcode)
        let existingProduct = null;
        if (sku) {
          existingProduct = await prisma.product.findFirst({
            where: { vendorId: vendor.id, sku },
          });
        }
        if (!existingProduct && barcode) {
          existingProduct = await prisma.product.findFirst({
            where: { vendorId: vendor.id, barcode },
          });
        }

        const productData = {
          vendorId: vendor.id,
          name: String(name).slice(0, 200),
          description: description ? String(description).slice(0, 2000) : null,
          category: category ? String(category).slice(0, 100) : null,
          barcode: barcode ? String(barcode).slice(0, 64) : null,
          sku: sku ? String(sku).slice(0, 64) : null,
          price: typeof price === 'number' ? price : 0,
          unit: unit ? String(unit).slice(0, 50) : null,
          stockQuantity: typeof stock_quantity === 'number' ? stock_quantity : 0,
          imageUrl: image_url || null,
          isAvailable: is_active !== false,
        };

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: productData,
          });
        } else {
          await prisma.product.create({ data: productData });
        }

        synced++;
      } catch (prodErr) {
        failed++;
        errors.push(`Product ${product?.erp_item_id || 'unknown'}: ${prodErr instanceof Error ? prodErr.message : 'error'}`);
        await recordIntegrationFailure({
          kind: 'product-sync',
          dedupeKey: `product:${product?.erp_tenant_id || 'unknown'}:${product?.erp_item_id || product?.sku || product?.barcode || 'unknown'}`,
          payload: { products: [product] },
          error: prodErr,
        }).catch((recordError) => console.error('[ERP Webhook] failed to record product dead letter:', recordError));
      }
    }

    console.log(`[ERP Webhook] product-sync: synced ${synced}/${products.length} products`);
    return res.json({
      success: true,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Product sync error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /erp-webhooks/customer-sync — receive customer data from ERP.
 * Creates or updates marketplace users and links ERP customer ID.
 */
router.post('/customer-sync', requireErpSecret, async (req: Request, res: Response) => {
  const { erp_tenant_id, customers } = req.body;

  if (!erp_tenant_id || !Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: erp_tenant_id and customers array required' });
  }

  try {
    // Find vendor by erpTenantId
    const vendor = await prisma.vendor.findFirst({
      where: { erpTenantId: erp_tenant_id },
      select: { id: true },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'No vendor found for this erp_tenant_id' });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        const {
          erp_customer_id,
          name,
          phone,
          email,
        } = customer;

        if (!erp_customer_id) {
          failed++;
          errors.push('Missing erp_customer_id');
          continue;
        }

        // The ERP customer link is authoritative and scoped to this vendor.
        let user = null;
        const existingLink = await prisma.erpCustomerLink.findUnique({
          where: { vendorId_erpCustomerId: { vendorId: vendor.id, erpCustomerId: String(erp_customer_id) } },
          include: { user: true },
        });
        if (existingLink) user = existingLink.user;
        if (phone) {
          user ??= await prisma.user.findUnique({ where: { phone: String(phone).slice(0, 20) } });
        }
        if (!user && email) {
          user = await prisma.user.findUnique({ where: { email: String(email).slice(0, 150) } });
        }

        if (user) {
          await prisma.erpCustomerLink.upsert({
            where: { vendorId_erpCustomerId: { vendorId: vendor.id, erpCustomerId: String(erp_customer_id) } },
            update: { userId: user.id },
            create: { vendorId: vendor.id, userId: user.id, erpCustomerId: String(erp_customer_id) },
          });
          console.log(`[ERP Webhook] customer-sync: user ${user.id} linked to ERP customer ${erp_customer_id}`);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              fullName: String(name || 'ERP Customer').slice(0, 100),
              phone: phone ? String(phone).slice(0, 20) : undefined,
              email: email ? String(email).slice(0, 150) : undefined,
              role: 'customer',
            },
          });
          await prisma.erpCustomerLink.create({
            data: { vendorId: vendor.id, userId: user.id, erpCustomerId: String(erp_customer_id) },
          });
          console.log(`[ERP Webhook] customer-sync: created and linked user ${user.id} for ERP customer ${erp_customer_id}`);
        }

        synced++;
      } catch (custErr) {
        failed++;
        errors.push(`Customer ${customer?.erp_customer_id || 'unknown'}: ${custErr instanceof Error ? custErr.message : 'error'}`);
        await recordIntegrationFailure({
          kind: 'customer-sync',
          dedupeKey: `customer:${erp_tenant_id}:${customer?.erp_customer_id || 'unknown'}`,
          vendorId: vendor.id,
          payload: { erp_tenant_id, customers: [customer] },
          error: custErr,
        }).catch((recordError) => console.error('[ERP Webhook] failed to record customer dead letter:', recordError));
      }
    }

    console.log(`[ERP Webhook] customer-sync: synced ${synced}/${customers.length} customers`);
    return res.json({
      success: true,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] Customer sync error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /erp-webhooks/dispatch-delivery — standalone ERP mode (Req 11.4/11.5).
 * The vendor's ERP sold an order (POS/phone) and requests a Doorli delivery:
 * verify the ERP secret, check the `doorli_delivery` feature flag, create a
 * `pos`-type Order linked to `erpOrderId`, then trigger the dispatch engine.
 */
router.post('/dispatch-delivery', requireErpSecret, async (req: Request, res: Response) => {
  const {
    vendor_id,
    erp_tenant_id,
    erp_order_id,
    customer,
    dropoff,
    total_amount,
    delivery_fee,
  } = req.body ?? {};

  if (!erp_order_id || (!vendor_id && !erp_tenant_id)) {
    return res
      .status(400)
      .json({ error: 'Invalid payload: require erp_order_id and vendor_id or erp_tenant_id' });
  }
  if (typeof total_amount !== 'number' || total_amount < 0) {
    return res.status(400).json({ error: 'Invalid payload: total_amount must be a number' });
  }
  if (!dropoff?.address_line || typeof dropoff.address_line !== 'string') {
    return res.status(400).json({ error: 'Invalid payload: dropoff.address_line is required' });
  }

  try {
    const vendor = vendor_id
      ? await prisma.vendor.findUnique({ where: { id: String(vendor_id) } })
      : await prisma.vendor.findFirst({ where: { erpTenantId: String(erp_tenant_id) } });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Doorli delivery is a paid add-on for standalone vendors — enforce the flag (Req 11.4)
    if (!(await isFeatureEnabled(vendor.id, DOORLI_DELIVERY_KEY))) {
      return res
        .status(403)
        .json({ error: 'doorli_delivery feature is disabled for this vendor', code: 'FEATURE_DISABLED' });
    }

    // Idempotent: the ERP may retry — one marketplace order per (vendor, erpOrderId)
    const existing = await prisma.order.findFirst({
      where: { vendorId: vendor.id, erpOrderId: String(erp_order_id).slice(0, 50) },
    });
    if (existing) {
      return res.json({
        success: true,
        idempotent: true,
        data: { orderId: existing.id, orderNumber: existing.orderNumber, status: existing.status },
      });
    }

    // Resolve/create the customer: ERP customers usually have no Doorli account
    const phone = customer?.phone ? String(customer.phone).slice(0, 20) : null;
    let customerUser = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          fullName: String(customer?.name || 'ERP Customer').slice(0, 100),
          phone: phone ?? undefined,
          role: 'customer',
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: 'ERP delivery',
        addressLine: String(dropoff.address_line),
        latitude: typeof dropoff.latitude === 'number' ? dropoff.latitude : undefined,
        longitude: typeof dropoff.longitude === 'number' ? dropoff.longitude : undefined,
      },
    });

    const fee = typeof delivery_fee === 'number' && delivery_fee >= 0 ? delivery_fee : 0;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Born `ready`: the ERP already sold & packed it — the dispatcher takes over
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerUser.id,
        vendorId: vendor.id,
        deliveryAddressId: address.id,
        status: 'ready',
        orderType: 'pos',
        subtotal: total_amount,
        deliveryFee: fee,
        totalAmount: total_amount + fee,
        paymentMethod: 'cod',
        specialInstructions: customer?.name ? `ERP order for ${customer.name}` : 'ERP order',
        erpOrderId: String(erp_order_id).slice(0, 50),
        erpSyncStatus: 'synced',
        erpSyncedAt: new Date(),
      },
    });

    // Kick the dispatch engine in the delivery service (fire-and-forget-ish:
    // we report the outcome but never roll back the created order).
    let dispatchStatus: 'requested' | 'unavailable' = 'unavailable';
    try {
      const base = (process.env.DELIVERY_SERVICE_URL || 'http://localhost:8086').replace(/\/$/, '');
      const resp = await fetch(`${base}/orders/internal/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': erpSecretExpected(),
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (resp.ok) dispatchStatus = 'requested';
    } catch {
      // Delivery service down — order stays `ready`; dispatch can be retried.
    }

    console.log(`[ERP Webhook] dispatch-delivery created order ${order.id} (${dispatchStatus})`);
    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        dispatch: dispatchStatus,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[ERP Webhook] dispatch-delivery error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
