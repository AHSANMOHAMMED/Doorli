import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import type { RideStatus } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getSocketServer } from '../../lib/socket.js';
import { asSingle } from '../../lib/httpParams.js';
import { applyWalletTransaction } from '../wallet/wallet.service.js';

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

function estimateFare(distanceKm: number, vehicleType: 'bike' | 'car' | 'van' | 'truck' = 'car') {
  const multipliers = { bike: 0.75, car: 1, van: 1.45, truck: 1.9 };
  const baseFare = Math.round(200 * multipliers[vehicleType]);
  const perKm = Math.round(80 * multipliers[vehicleType]);
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
        vehicleType: z.enum(['bike', 'car', 'van', 'truck']).default('car'),
      })
      .parse(req.body);
    const distanceKm = haversineKm(body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
    res.json({ success: true, data: estimateFare(distanceKm, body.vehicleType) });
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
        vehicleType: z.enum(['bike', 'car', 'van', 'truck']).default('car'),
      })
      .parse(req.body);

    const distanceKm = haversineKm(body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
    const fare = estimateFare(Math.max(distanceKm, 1), body.vehicleType);
    const idempotencyKey = String(req.headers['idempotency-key'] || '');
    if (!idempotencyKey) throw new AppError(400, 'Idempotency-Key header is required');
    const existing = await prisma.rideRequest.findFirst({ where: { customerId: req.user!.id, idempotencyKey } });
    if (existing) {
      res.status(200).json({ success: true, data: { id: existing.id, status: existing.status, totalFare: Number(existing.totalFare), replayed: true } });
      return;
    }

    let ride;
    try {
      ride = await prisma.rideRequest.create({
        data: {
        customerId: req.user!.id,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        idempotencyKey,
        vehicleType: body.vehicleType,
        pickupAddress: body.pickupAddress,
        dropoffAddress: body.dropoffAddress,
        baseFare: fare.baseFare,
        totalFare: fare.totalFare,
        status: RIDE_STATUS.searching,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        const replay = await prisma.rideRequest.findFirst({ where: { customerId: req.user!.id, idempotencyKey } });
        if (replay) {
          res.status(200).json({ success: true, data: { id: replay.id, status: replay.status, totalFare: Number(replay.totalFare), replayed: true } });
          return;
        }
      }
      throw error;
    }

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
        vehicleType: ride.vehicleType,
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
    res.json({ success: true, data: rides.map((ride) => ({ ...ride, baseFare: Number(ride.baseFare), totalFare: Number(ride.totalFare) })) });
  } catch (err) {
    next(err);
  }
});

ridesRouter.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const id = asSingle(req.params.id);
    if (!id) throw new AppError(400, 'Ride id required');
    const ride = await prisma.rideRequest.findUnique({ where: { id } });
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
    const id = asSingle(req.params.id);
    if (!id) throw new AppError(400, 'Ride id required');
    const ride = await prisma.rideRequest.findUnique({ where: { id } });
    if (!ride || ride.customerId !== req.user!.id) throw new AppError(404, 'Ride not found');
    if (ride.status === RIDE_STATUS.completed || ride.status === RIDE_STATUS.cancelled) throw new AppError(400, 'Ride cannot be cancelled');
    const updated = await prisma.rideRequest.update({
      where: { id: ride.id },
      data: { status: RIDE_STATUS.cancelled },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

ridesRouter.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const id = asSingle(req.params.id);
    const status = z.enum(['assigned', 'arrived', 'in_transit', 'completed', 'cancelled']).parse(req.body.status);
    const ride = await prisma.rideRequest.findUnique({ where: { id: id || '' } });
    if (!ride) throw new AppError(404, 'Ride not found');
    if (req.user!.role !== 'admin' && req.user!.role !== 'driver') throw new AppError(403, 'Only a driver or admin can update ride status');
    if (req.user!.role === 'driver' && ride.driverId !== req.user!.id) throw new AppError(403, 'Ride is assigned to another driver');
    const allowed: Record<string, string[]> = { searching: ['assigned', 'cancelled'], assigned: ['arrived', 'cancelled'], arrived: ['in_transit', 'cancelled'], in_transit: ['completed', 'cancelled'] };
    if (!allowed[ride.status]?.includes(status)) throw new AppError(400, `Cannot transition from ${ride.status} to ${status}`);
    if (status === RIDE_STATUS.completed) {
      await applyWalletTransaction({ userId: ride.customerId, amount: -Number(ride.totalFare), type: 'ride_payment', idempotencyKey: `ride:${ride.id}`, reference: ride.id, description: `Ride payment (${ride.vehicleType})` });
    }
    const updated = await prisma.rideRequest.update({ where: { id: ride.id }, data: { status } });
    try { getSocketServer()?.emit('ride:status', { ride: updated }); } catch { /* socket optional */ }
    res.json({ success: true, data: { ...updated, totalFare: Number(updated.totalFare) } });
  } catch (err) { next(err); }
});

export default ridesRouter;
