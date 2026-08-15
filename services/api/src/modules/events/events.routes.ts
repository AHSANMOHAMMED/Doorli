import { Router } from 'express';
import { z, ZodError } from 'zod';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import * as eventsService from './events.service.js';

const eventsRouter = Router();
eventsRouter.use(authenticateToken);

// ─── Validation schemas ───────────────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  eventDate: z.string(),
  guestCount: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  city: z.string().max(80).optional(),
  venueVendorId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        vendorId: z.string().uuid().optional(),
        serviceType: z.string(),
        label: z.string(),
        amount: z.number().nonnegative().optional(),
        estimatedCost: z.number().nonnegative().optional(),
      }),
    )
    .optional(),
});

const addVendorSchema = z.object({
  vendorId: z.string().uuid(),
  serviceType: z.string().min(1),
  amount: z.number().nonnegative(),
});

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new AppError(400, err.errors.map((e) => e.message).join(', '));
    }
    throw new AppError(400, 'Validation failed');
  }
}

// ─── GET /events/my-events — customer's event packages (Req 7.5) ─────────────
eventsRouter.get('/my-events', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const packages = await eventsService.getMyEvents(req.user.id);
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
});

// Kept as alias for backward compat
eventsRouter.get('/my', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const packages = await eventsService.getMyEvents(req.user.id);
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
});

// ─── POST /events — create event package (Req 7.1) ───────────────────────────
eventsRouter.post('/', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const input = parseBody(createEventSchema, req.body);
    const pkg = await eventsService.createEventPackage(req.user.id, input, String(req.headers['idempotency-key'] || '') || undefined);
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

// ─── GET /events/:id/summary — summary with budget warning (Req 7.5, 7.6) ────
eventsRouter.get('/:id/summary', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const summary = await eventsService.getEventSummary(
      req.params.id as string,
      req.user.id
    );
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /events/:id/add-vendor — add vendor to items (Req 7.2) ────────────
eventsRouter.patch('/:id/add-vendor', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { vendorId, serviceType, amount } = parseBody(addVendorSchema, req.body);
    const pkg = await eventsService.addVendorToEvent(
      req.params.id as string,
      req.user.id,
      vendorId,
      serviceType,
      amount
    );
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /events/:id/remove-vendor/:vendorId — remove vendor (Req 7.3) ────
eventsRouter.delete('/:id/remove-vendor/:vendorId', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const pkg = await eventsService.removeVendorFromEvent(
      req.params.id as string,
      req.user.id,
      req.params.vendorId as string
    );
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

// ─── POST /events/:id/confirm — confirm event, create bookings (Req 7.4) ─────
eventsRouter.post('/:id/confirm', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const result = await eventsService.confirmEventPackage(
      req.params.id as string,
      req.user.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /events/:id — generic update (kept for backward compat) ────────────
eventsRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const { prisma } = await import('@doorli/db');
    const existing = await prisma.eventPackage.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.customerId !== req.user.id) throw new AppError(404, 'Not found');
    if (existing.status === 'confirmed' || existing.status === 'cancelled') {
      throw new AppError(400, `Cannot modify a ${existing.status} event`);
    }

    const body = z
      .object({
        title: z.string().min(3).optional(),
        guestCount: z.number().int().optional(),
        budget: z.number().positive().optional(),
        city: z.string().max(80).optional(),
        venueVendorId: z.string().uuid().nullable().optional(),
        items: z.array(z.any()).optional(),
        status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
      })
      .parse(req.body);

    const totalEstimate = body.items
      ? body.items.reduce(
          (s: number, i: { amount?: number; estimatedCost?: number }) =>
            s + (i.amount ?? i.estimatedCost ?? 0),
          0
        )
      : undefined;

    const pkg = await prisma.eventPackage.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(totalEstimate !== undefined ? { totalEstimate } : {}),
      },
    });
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
});

export default eventsRouter;
