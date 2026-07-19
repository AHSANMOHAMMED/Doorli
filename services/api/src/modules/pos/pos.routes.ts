import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@doorli/db';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErpIntegrationService } from '../../lib/erpIntegration.js';
import { emitOrderEvent } from '../../lib/socket.js';

const posRouter = Router();
posRouter.use(authenticateToken, requireRole('vendor', 'admin'));

async function getVendorForUser(userId: string, role: string, vendorId?: string) {
  if (role === 'admin' && vendorId) {
    const v = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!v) throw new AppError(404, 'Vendor not found');
    return v;
  }
  const v = await prisma.vendor.findFirst({ where: { userId } });
  if (!v) throw new AppError(404, 'Vendor profile not found');
  return v;
}

async function resolveLiveStock(
  vendor: { erpTenantId: string | null },
  product: { id: string; stockQuantity: number; barcode: string | null; sku: string | null },
): Promise<number> {
  if (!vendor.erpTenantId) return product.stockQuantity;
  try {
    const inv = await ErpIntegrationService.getInventoryFromErp(vendor.erpTenantId, product.id);
    const qty =
      inv?.quantity ??
      inv?.stock ??
      inv?.data?.quantity ??
      (Array.isArray(inv?.items)
        ? inv.items.find(
            (i: { barcode?: string; sku?: string }) =>
              (product.barcode && i.barcode === product.barcode) ||
              (product.sku && i.sku === product.sku),
          )?.quantity
        : null);
    if (qty != null && !Number.isNaN(Number(qty))) return Number(qty);
  } catch {
    // fall through
  }
  return product.stockQuantity;
}

/** Lookup product by barcode (or SKU) for the logged-in vendor */
posRouter.get('/barcode/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const code = decodeURIComponent(String(req.params.code || '')).trim();
    if (!code) throw new AppError(400, 'Barcode required');

    const product = await prisma.product.findFirst({
      where: {
        vendorId: vendor.id,
        OR: [
          { barcode: code },
          { sku: code },
          { barcode: { equals: code, mode: 'insensitive' } },
          { sku: { equals: code, mode: 'insensitive' } },
        ],
      },
    });

    if (!product) {
      res.status(404).json({ success: false, error: 'No product for this barcode' });
      return;
    }

    const liveStock = await resolveLiveStock(vendor, product);

    res.json({
      success: true,
      data: {
        ...product,
        price: Number(product.price),
        liveStock,
        erpLinked: !!vendor.erpTenantId,
        isLowStock: liveStock <= (product.lowStockAt ?? 5),
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Stock board: all products + low-stock filter */
posRouter.get('/stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const lowOnly = String(req.query.lowOnly || '') === '1';

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
    });

    const items = await Promise.all(
      products.map(async (p) => {
        const liveStock = await resolveLiveStock(vendor, p);
        const lowAt = p.lowStockAt ?? 5;
        return {
          ...p,
          price: Number(p.price),
          liveStock,
          isLowStock: liveStock <= lowAt,
          erpLinked: !!vendor.erpTenantId,
        };
      }),
    );

    const filtered = lowOnly ? items.filter((i) => i.isLowStock) : items;
    res.json({
      success: true,
      data: {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        erpLinked: !!vendor.erpTenantId,
        lowStockCount: items.filter((i) => i.isLowStock).length,
        items: filtered,
      },
    });
  } catch (err) {
    next(err);
  }
});

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive().optional(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(['cash', 'card', 'cod', 'wallet']).default('cash'),
  customerName: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

/** In-store POS sale: decrement stock, mark paid+delivered, return printable receipt */
posRouter.post('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role);
    const input = saleSchema.parse(req.body);

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, vendorId: vendor.id },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    for (const line of input.items) {
      const p = map.get(line.productId);
      if (!p) throw new AppError(400, `Product not found: ${line.productId}`);
      if (!p.isAvailable) throw new AppError(400, `${p.name} is unavailable`);
      if (p.stockQuantity < line.quantity) {
        throw new AppError(400, `Insufficient stock for ${p.name} (have ${p.stockQuantity})`);
      }
    }

    const priced = input.items.map((line) => {
      const p = map.get(line.productId)!;
      const unitPrice = line.unitPrice ?? Number(p.price);
      return {
        productId: p.id,
        name: p.name,
        barcode: p.barcode,
        quantity: line.quantity,
        unitPrice,
        totalPrice: unitPrice * line.quantity,
      };
    });

    const subtotal = priced.reduce((s, i) => s + i.totalPrice, 0);
    const orderNumber = `POS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const paymentMethod =
      input.paymentMethod === 'cash'
        ? PaymentMethod.cash
        : input.paymentMethod === 'card'
          ? PaymentMethod.card
          : input.paymentMethod === 'wallet'
            ? PaymentMethod.wallet
            : PaymentMethod.cod;

    const order = await prisma.$transaction(async (tx) => {
      for (const line of priced) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) throw new AppError(400, `Insufficient stock for ${line.name}`);
        const product = await tx.product.findUnique({ where: { id: line.productId } });
        if (product && product.stockQuantity <= 0) {
          await tx.product.update({
            where: { id: line.productId },
            data: { isAvailable: false },
          });
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerId: req.user!.id,
          vendorId: vendor.id,
          status: OrderStatus.delivered,
          orderType: OrderType.pos,
          subtotal,
          deliveryFee: 0,
          discountAmount: 0,
          totalAmount: subtotal,
          paymentMethod,
          paymentStatus: PaymentStatus.paid,
          specialInstructions: [
            'POS in-store sale',
            input.customerName ? `Customer: ${input.customerName}` : null,
            input.note || null,
          ]
            .filter(Boolean)
            .join(' · '),
          items: {
            create: priced.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          vendor: { select: { businessName: true, addressLine: true, city: true, phone: true } },
        },
      });
    });

    if (vendor.erpTenantId) {
      try {
        await ErpIntegrationService.syncOrderToErp({
          tenantId: vendor.erpTenantId,
          marketplaceOrderId: order.id,
          marketplaceOrderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          customerInfo: { name: input.customerName || 'Walk-in' },
          items: priced.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            price: i.unitPrice,
          })),
        });
      } catch {
        // soft-fail ERP
      }
    }

    emitOrderEvent('order:pos_sale', [`vendor:${vendor.id}`], {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });

    const receipt = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      businessName: order.vendor.businessName,
      address: [order.vendor.addressLine, order.vendor.city].filter(Boolean).join(', '),
      phone: order.vendor.phone,
      cashier: req.user!.id,
      customerName: input.customerName || 'Walk-in',
      paymentMethod: input.paymentMethod,
      paidAt: order.createdAt,
      items: priced,
      subtotal,
      total: subtotal,
      note: input.note || null,
    };

    res.status(201).json({ success: true, data: { order, receipt } });
  } catch (err) {
    next(err);
  }
});

/** Recent POS sales for the vendor */
posRouter.get('/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role);
    const sales = await prisma.order.findMany({
      where: { vendorId: vendor.id, orderType: OrderType.pos },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: { include: { product: { select: { name: true, barcode: true } } } },
      },
    });
    res.json({ success: true, data: { items: sales } });
  } catch (err) {
    next(err);
  }
});

export default posRouter;
