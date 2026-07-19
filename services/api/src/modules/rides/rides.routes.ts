import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import type { RideStatus } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getSocketServer } from '../../lib/socket.js';

/** Runtime enum mirror — RideStatus is type-only from @doorli/db */
const RIDE_STATUS = {
  searching: 'searching',
  assigned: 'assigned',
  arrived: 'arrived',
  in_transit: 'in_transit',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<string, RideStatus>;

const ridesRouter = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFare(distanceKm: number) {
  const baseFare = 200;
  const perKm = 80;
  const totalFare = Math.round(baseFare + distanceKm * perKm);
  return { baseFare, distanceKm: Number(distanceKm.toFixed(2)), totalFare };
}

ridesRouter.post('/estimate', async (req, res, next) => {
  try {
    const body = z
      .object({
        pickupLat: z.number(),
        pickupLng: z.number(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
      })
      .parse(req.body);
    const distanceKm = haversineKm(body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
    res.json({ success: true, data: estimateFare(distanceKm) });
  } catch (err) {
    next(err);
  }
});

ridesRouter.post('/', authenticateToken, async (req, res, next) => {
  try {
    const body = z
      .object({
        pickupLat: z.number(),
        pickupLng: z.number(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
        pickupAddress: z.string().optional(),
        dropoffAddress: z.string().optional(),
      })
      .parse(req.body);

    const distanceKm = haversineKm(body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
    const fare = estimateFare(Math.max(distanceKm, 1));

    const ride = await prisma.rideRequest.create({
      data: {
        customerId: req.user!.id,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        baseFare: fare.baseFare,
        totalFare: fare.totalFare,
        status: RIDE_STATUS.searching,
      },
    });

    try {
      getSocketServer()?.emit('ride:searching', { rideId: ride.id, customerId: req.user!.id });
    } catch {
      // socket optional
    }

    res.status(201).json({
      success: true,
      data: {
        id: ride.id,
        status: ride.status,
        totalFare: Number(ride.totalFare),
        message: 'Ride requested — searching for a driver…',
        pickupAddress: body.pickupAddress,
        dropoffAddress: body.dropoffAddress,
      },
    });
  } catch (err) {
    next(err);
  }
});

ridesRouter.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const rides = await prisma.rideRequest.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: rides });
  } catch (err) {
    next(err);
  }
});

ridesRouter.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const ride = await prisma.rideRequest.findUnique({ where: { id: req.params.id } });
    if (!ride) throw new AppError(404, 'Ride not found');
    if (ride.customerId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'driver') {
      throw new AppError(403, 'Access denied');
    }
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
});

ridesRouter.patch('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const ride = await prisma.rideRequest.findUnique({ where: { id: req.params.id } });
    if (!ride || ride.customerId !== req.user!.id) throw new AppError(404, 'Ride not found');
    const updated = await prisma.rideRequest.update({
      where: { id: ride.id },
      data: { status: RIDE_STATUS.cancelled },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default ridesRouter;
