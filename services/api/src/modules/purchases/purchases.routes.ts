import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma, SupplierPurchaseStatus } from '@doorli/db';
import { authenticateToken, requireRole } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { parseInvoiceFile, normalizeKey } from './invoiceExtract.js';
import { matchInvoiceLine } from './matchProducts.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /\.(csv|xlsx|xls|pdf|txt)$/i.test(file.originalname) ||
      [
        'text/csv',
        'text/plain',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ].includes(file.mimetype);
    cb(ok ? null : new Error('Only CSV, Excel, PDF, or TXT invoices are allowed'), ok);
  },
});

const purchasesRouter = Router();
purchasesRouter.use(authenticateToken, requireRole('vendor', 'admin'));

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

/** Upload supplier invoice → draft purchase with matched suggestions */
purchasesRouter.post(
  '/import',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendor = await getVendorForUser(
        req.user!.id,
        req.user!.role,
        String(req.body.vendorId || req.query.vendorId || ''),
      );
      if (!req.file) throw new AppError(400, 'Upload an invoice file (CSV, Excel, or PDF)');

      const parsed = await parseInvoiceFile(req.file.originalname, req.file.buffer, req.file.mimetype);
      if (!parsed.lines.length) {
        throw new AppError(
          400,
          parsed.warnings.join(' ') ||
            'Could not extract line items. Export the invoice as Excel/CSV with Name, Qty, Price columns.',
        );
      }

      const [products, aliases] = await Promise.all([
        prisma.product.findMany({
          where: { vendorId: vendor.id },
          select: { id: true, name: true, barcode: true, sku: true },
        }),
        prisma.productAlias.findMany({
          where: { vendorId: vendor.id },
          select: { productId: true, aliasKey: true },
        }),
      ]);

      const invoiceDate = parsed.invoiceDate ? new Date(parsed.invoiceDate) : null;
      const totalAmount = parsed.lines.reduce((s, l) => {
        const lt = l.lineTotal ?? (l.unitCost != null ? l.unitCost * l.quantity : 0);
        return s + (lt || 0);
      }, 0);

      const purchase = await prisma.supplierPurchase.create({
        data: {
          vendorId: vendor.id,
          supplierName: parsed.supplierName,
          invoiceNumber: parsed.invoiceNumber,
          invoiceDate: invoiceDate && !Number.isNaN(invoiceDate.getTime()) ? invoiceDate : null,
          sourceFilename: req.file.originalname,
          sourceType: parsed.sourceType,
          status: SupplierPurchaseStatus.draft,
          totalAmount,
          rawExtract: { warnings: parsed.warnings, lineCount: parsed.lines.length },
          items: {
            create: parsed.lines.map((line) => {
              const match = matchInvoiceLine(line, products, aliases);
              return {
                lineNo: line.lineNo,
                invoiceName: line.invoiceName.slice(0, 300),
                barcode: line.barcode?.slice(0, 64) || null,
                sku: line.sku?.slice(0, 64) || null,
                quantity: line.quantity,
                unit: line.unit?.slice(0, 40) || null,
                unitCost: line.unitCost ?? null,
                lineTotal: line.lineTotal ?? null,
                action: match.action,
                productId: match.productId,
                matchConfidence: match.confidence,
                matchMethod: match.method,
                saveAsAlias: true,
              };
            }),
          },
        },
        include: { items: { orderBy: { lineNo: 'asc' } } },
      });

      const needsReview = purchase.items.filter((i) => i.action === 'needs_review').length;
      const exactMatched = purchase.items.filter(
        (i) => i.action === 'matched' && i.matchConfidence === 100,
      ).length;

      res.status(201).json({
        success: true,
        data: {
          purchase,
          summary: {
            totalLines: purchase.items.length,
            exactMatched,
            needsReview,
            warnings: parsed.warnings,
            canConfirm: needsReview === 0,
            accuracyNote:
              'Only barcode/SKU/alias/exact-name matches auto-link (100%). Review every other line before Import to stock.',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const list = await prisma.supplierPurchase.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: { _count: { select: { items: true } } },
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

/** Manually add / list aliases for local-language names (before /:id) */
purchasesRouter.get('/aliases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const aliases = await prisma.productAlias.findMany({
      where: { vendorId: vendor.id },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { alias: 'asc' },
    });
    res.json({ success: true, data: aliases });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post('/aliases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.body.vendorId || ''));
    const body = z
      .object({ productId: z.string().uuid(), alias: z.string().min(1).max(200) })
      .parse(req.body);
    const product = await prisma.product.findFirst({
      where: { id: body.productId, vendorId: vendor.id },
    });
    if (!product) throw new AppError(404, 'Product not found');
    const aliasKey = normalizeKey(body.alias);
    if (!aliasKey) throw new AppError(400, 'Invalid alias');

    const row = await prisma.productAlias.upsert({
      where: { vendorId_aliasKey: { vendorId: vendor.id, aliasKey } },
      create: {
        vendorId: vendor.id,
        productId: product.id,
        alias: body.alias.trim(),
        aliasKey,
      },
      update: { productId: product.id, alias: body.alias.trim() },
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const purchase = await prisma.supplierPurchase.findFirst({
      where: { id: req.params.id, vendorId: vendor.id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });
    if (!purchase) throw new AppError(404, 'Purchase not found');

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      select: { id: true, name: true, barcode: true, sku: true, stockQuantity: true, price: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { purchase, products } });
  } catch (err) {
    next(err);
  }
});

const itemPatchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      action: z.enum(['matched', 'create_new', 'skip', 'needs_review']),
      productId: z.string().uuid().nullable().optional(),
      quantity: z.number().positive().optional(),
      unitCost: z.number().nonnegative().optional().nullable(),
      invoiceName: z.string().min(1).max(300).optional(),
      barcode: z.string().max(64).optional().nullable(),
      sku: z.string().max(64).optional().nullable(),
      saveAsAlias: z.boolean().optional(),
      /** When linking a fuzzy suggestion, vendor explicitly confirms */
      confirmMatch: z.boolean().optional(),
    }),
  ),
  supplierName: z.string().max(200).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/** Vendor corrects line mappings before stock update */
purchasesRouter.patch('/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const body = itemPatchSchema.parse(req.body);
    const purchase = await prisma.supplierPurchase.findFirst({
      where: { id: req.params.id, vendorId: vendor.id },
    });
    if (!purchase) throw new AppError(404, 'Purchase not found');
    if (purchase.status !== SupplierPurchaseStatus.draft) {
      throw new AppError(400, 'Only draft imports can be edited');
    }

    await prisma.$transaction(
      body.items.map((item) => {
        let action = item.action;
        let confidence: number | undefined;
        let method: string | undefined;

        if (item.action === 'matched') {
          if (!item.productId) {
            throw new AppError(400, `Line ${item.id}: matched requires a product`);
          }
          // Vendor explicit confirm upgrades fuzzy → safe matched
          if (item.confirmMatch) {
            confidence = 100;
            method = 'vendor_confirmed';
          }
        }
        if (item.action === 'create_new') {
          // product created on confirm
        }
        if (action === 'needs_review') {
          // leave as-is
        }

        return prisma.supplierPurchaseItem.update({
          where: { id: item.id },
          data: {
            action,
            productId: item.productId === undefined ? undefined : item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost === undefined ? undefined : item.unitCost,
            invoiceName: item.invoiceName,
            barcode: item.barcode === undefined ? undefined : item.barcode,
            sku: item.sku === undefined ? undefined : item.sku,
            saveAsAlias: item.saveAsAlias,
            ...(confidence != null ? { matchConfidence: confidence, matchMethod: method } : {}),
          },
        });
      }),
    );

    if (body.supplierName !== undefined || body.invoiceNumber !== undefined || body.notes !== undefined) {
      await prisma.supplierPurchase.update({
        where: { id: purchase.id },
        data: {
          supplierName: body.supplierName === undefined ? undefined : body.supplierName,
          invoiceNumber: body.invoiceNumber === undefined ? undefined : body.invoiceNumber,
          notes: body.notes === undefined ? undefined : body.notes,
        },
      });
    }

    const updated = await prisma.supplierPurchase.findUnique({
      where: { id: purchase.id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });

    const needsReview = updated!.items.filter((i) => i.action === 'needs_review').length;
    res.json({
      success: true,
      data: updated,
      summary: { needsReview, canConfirm: needsReview === 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Confirm import → update stock + aliases.
 * Refuses if any line still needs_review.
 * Matched lines must have productId; create_new creates product then stocks.
 */
purchasesRouter.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const purchase = await prisma.supplierPurchase.findFirst({
      where: { id: req.params.id, vendorId: vendor.id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });
    if (!purchase) throw new AppError(404, 'Purchase not found');
    if (purchase.status !== SupplierPurchaseStatus.draft) {
      throw new AppError(400, 'Purchase already confirmed or cancelled');
    }

    const blocking = purchase.items.filter((i) => i.action === 'needs_review');
    if (blocking.length) {
      throw new AppError(
        400,
        `${blocking.length} line(s) still need review. Link each to a product, choose Create new, or Skip — then import.`,
      );
    }

    for (const item of purchase.items) {
      if (item.action === 'matched' && !item.productId) {
        throw new AppError(400, `Line ${item.lineNo} marked matched but has no product`);
      }
      if (item.action === 'matched' && item.matchConfidence < 100) {
        throw new AppError(
          400,
          `Line ${item.lineNo} ("${item.invoiceName}") is not a 100% match. Open the line, pick the product, and confirm the match.`,
        );
      }
      if (Number(item.quantity) <= 0) {
        throw new AppError(400, `Line ${item.lineNo} has invalid quantity`);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const stockUpdates: Array<{ productId: string; name: string; added: number; newStock: number }> =
        [];

      for (const item of purchase.items) {
        if (item.action === 'skip') continue;

        let productId = item.productId;

        if (item.action === 'create_new') {
          const created = await tx.product.create({
            data: {
              vendorId: vendor.id,
              name: item.invoiceName.slice(0, 200),
              barcode: item.barcode || null,
              sku: item.sku || null,
              price: item.unitCost != null ? Number(item.unitCost) : 0,
              stockQuantity: 0,
              isAvailable: true,
              unit: item.unit || null,
            },
          });
          productId = created.id;
          await tx.supplierPurchaseItem.update({
            where: { id: item.id },
            data: { productId, matchConfidence: 100, matchMethod: 'created_on_import' },
          });
        }

        if (!productId) throw new AppError(400, `Line ${item.lineNo} missing product`);

        // Verify product belongs to this vendor
        const product = await tx.product.findFirst({
          where: { id: productId, vendorId: vendor.id },
        });
        if (!product) throw new AppError(400, `Invalid product on line ${item.lineNo}`);

        const qty = Math.round(Number(item.quantity));
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { increment: qty }, isAvailable: true },
        });

        stockUpdates.push({
          productId,
          name: product.name,
          added: qty,
          newStock: updated.stockQuantity,
        });

        // Remember supplier wording / local language as alias
        if (item.saveAsAlias) {
          const aliasKey = normalizeKey(item.invoiceName);
          if (aliasKey && aliasKey !== normalizeKey(product.name)) {
            await tx.productAlias.upsert({
              where: { vendorId_aliasKey: { vendorId: vendor.id, aliasKey } },
              create: {
                vendorId: vendor.id,
                productId,
                alias: item.invoiceName.slice(0, 200),
                aliasKey,
              },
              update: { productId, alias: item.invoiceName.slice(0, 200) },
            });
          }
        }
      }

      const confirmed = await tx.supplierPurchase.update({
        where: { id: purchase.id },
        data: {
          status: SupplierPurchaseStatus.confirmed,
          confirmedAt: new Date(),
        },
        include: { items: { orderBy: { lineNo: 'asc' } } },
      });

      return { purchase: confirmed, stockUpdates };
    });

    res.json({
      success: true,
      data: result,
      message: `Imported ${result.stockUpdates.length} line(s) into stock.`,
    });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorForUser(req.user!.id, req.user!.role, String(req.query.vendorId || ''));
    const purchase = await prisma.supplierPurchase.findFirst({
      where: { id: req.params.id, vendorId: vendor.id },
    });
    if (!purchase) throw new AppError(404, 'Purchase not found');
    if (purchase.status === SupplierPurchaseStatus.confirmed) {
      throw new AppError(400, 'Cannot cancel a confirmed purchase (stock already updated)');
    }
    const updated = await prisma.supplierPurchase.update({
      where: { id: purchase.id },
      data: { status: SupplierPurchaseStatus.cancelled },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default purchasesRouter;
