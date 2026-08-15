import { Router, Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import {
  createBookingSchema,
  updateBookingStatusSchema,
} from './bookings.schema.js';
import * as bookingsService from './bookings.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const bookingsRouter = Router();

function validate<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError(400, err.errors.map((e) => e.message).join(', ')));
      } else {
        next(new AppError(400, 'Validation failed'));
      }
    }
  };
}

// Public availability before auth-gated routes
bookingsRouter.get('/availability/:vendorId', async (req, res, next) => {
  try {
    const from = String(req.query.from || new Date().toISOString());
    const to = String(req.query.to || new Date(Date.now() + 30 * 86400000).toISOString());
    const slots = await bookingsService.getAvailability(req.params.vendorId, from, to);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/hotels/:vendorId/rooms', async (req, res, next) => {
  try {
    const rooms = await bookingsService.getHotelRooms(req.params.vendorId, String(req.query.from || ''), String(req.query.to || ''));
    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
});

bookingsRouter.get('/halls/:vendorId/slots', async (req, res, next) => {
  try { res.json({ success: true, data: await bookingsService.getHallSlots(req.params.vendorId, typeof req.query.eventDate === 'string' ? req.query.eventDate : undefined) }); } catch (err) { next(err); }
});

bookingsRouter.get('/beauty/:vendorId/services', async (req, res, next) => {
  try { res.json({ success: true, data: await bookingsService.getBeautyServices(req.params.vendorId) }); } catch (err) { next(err); }
});

// All booking routes require authentication
bookingsRouter.use(authenticateToken);

bookingsRouter.post('/', validate(createBookingSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const booking = await bookingsService.createBooking(req.user.id, { ...req.body, idempotencyKey: String(req.headers['idempotency-key'] || '') || undefined });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post('/hotels/:vendorId/rooms', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') throw new AppError(403, 'Access denied');
    const input = z.object({ roomType: z.string().min(2).max(100), description: z.string().optional(), capacity: z.number().int().positive().max(20), totalRooms: z.number().int().positive().max(1000), price: z.number().positive(), amenities: z.array(z.string()).optional() }).parse(req.body);
    const room = await bookingsService.createHotelRoom(req.params.vendorId, req.user.id, req.user.role, input);
    res.status(201).json({ success: true, data: room });
  } catch (err) { next(err); }
});

bookingsRouter.post('/halls/:vendorId/slots', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') throw new AppError(403, 'Access denied');
    const input = z.object({ name: z.string().min(2).max(100), slotType: z.string().min(2).max(30), capacity: z.number().int().positive().max(10000), price: z.number().positive(), amenities: z.array(z.string()).optional() }).parse(req.body);
    res.status(201).json({ success: true, data: await bookingsService.createHallSlot(req.params.vendorId, req.user.id, req.user.role, input) });
  } catch (err) { next(err); }
});

bookingsRouter.post('/beauty/:vendorId/services', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') throw new AppError(403, 'Access denied');
    const input = z.object({ name: z.string().min(2).max(120), description: z.string().optional(), durationMins: z.number().int().min(15).max(480), price: z.number().positive() }).parse(req.body);
    res.status(201).json({ success: true, data: await bookingsService.createBeautyService(req.params.vendorId, req.user.id, req.user.role, input) });
  } catch (err) { next(err); }
});

bookingsRouter.get('/my-bookings', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const bookings = await bookingsService.getUserBookings(req.user.id);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const bookings = await bookingsService.getVendorBookings(req.params.vendorId as string);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const booking = await bookingsService.getBookingById(
      req.params.id as string,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.patch('/:id/status', validate(updateBookingStatusSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    // Only vendors can update booking status
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const booking = await bookingsService.updateBookingStatus(
      req.params.id as string,
      req.body,
      req.user.id
    );
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const booking = await bookingsService.cancelBooking(
      req.params.id as string,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post('/:id/contract', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { generateHallContract } = await import('./contract.js');
    const result = await generateHallContract(req.params.id as string);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default bookingsRouter;
