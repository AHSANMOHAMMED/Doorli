import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
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

// All booking routes require authentication
bookingsRouter.use(authenticateToken);

bookingsRouter.post('/', validate(createBookingSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const booking = await bookingsService.createBooking(req.user.id, req.body);
    res.json({ success: true, data: booking });
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
    // Only vendors can access their bookings
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const bookings = await bookingsService.getVendorBookings(req.params.vendorId as string);
    res.json({ success: true, data: bookings });
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

bookingsRouter.delete('/:id/cancel', async (req, res, next) => {
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
