import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@doorli/db';
import type { RideStatus } from '@doorli/db';
import { calculateFare } from '../pricingEngine.js';

/** Runtime enum mirror — RideStatus is type-only from @doorli/db */
const RIDE_STATUS = {
  searching: 'searching',
  assigned: 'assigned',
  arrived: 'arrived',
  in_transit: 'in_transit',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<string, RideStatus>;

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'doorli-dev-access-secret-change-in-prod';

type AuthUser = { id: string; role: string };

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as {
      sub?: string;
      id?: string;
      role?: string;
    };
    (req as Request & { user?: AuthUser }).user = {
      id: payload.sub || payload.id || '',
      role: payload.role || 'customer',
    };
    if (!(req as Request & { user?: AuthUser }).user?.id) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

const getZoneDemand = async (lat: number, lng: number): Promise<number> => {
  try {
    const result = await prisma.$queryRaw<Array<{ demand_level: number }>>`
      SELECT demand_level 
      FROM geographic_zones 
      WHERE ST_Contains(boundaries::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry)
      LIMIT 1
    `;
    return result.length > 0 ? result[0].demand_level : 1;
  } catch {
    return 1;
  }
};

const calculateDistanceKm = async (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): Promise<number> => {
  try {
    const result = await prisma.$queryRaw<Array<{ dist_km: number }>>`
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(${lng1}, ${lat1}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng2}, ${lat2}), 4326)::geography
      ) / 1000 AS dist_km
    `;
    return result.length > 0 ? Number(result[0].dist_km) : 0;
  } catch {
    return 0;
  }
};

router.post('/estimate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, baseFare = 200 } = req.body;
    const [pickupDemand, dropoffDemand, distanceKm] = await Promise.all([
      getZoneDemand(Number(pickupLat), Number(pickupLng)),
      getZoneDemand(Number(dropoffLat), Number(dropoffLng)),
      calculateDistanceKm(
        Number(pickupLat),
        Number(pickupLng),
        Number(dropoffLat),
        Number(dropoffLng),
      ),
    ]);
    const estimate = calculateFare(Number(baseFare), pickupDemand, dropoffDemand, distanceKm);
    res.json({ ...estimate, distanceKm, pickupDemand, dropoffDemand });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Estimate failed' });
  }
});

router.get('/nearby-drivers', async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = 5 } = req.query;
  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }
  try {
    const nearbyDrivers = await prisma.$queryRaw`
      SELECT 
        id, 
        user_id as "userId",
        vehicle_type as "vehicleType",
        current_latitude as "currentLatitude",
        current_longitude as "currentLongitude",
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography
        ) / 1000 AS "distanceKm"
      FROM drivers
      WHERE is_online = true
        AND location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)::geography,
          ${Number(radiusKm) * 1000}
        )
      ORDER BY "distanceKm" ASC
      LIMIT 20
    `;
    res.json({ drivers: nearbyDrivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find nearby drivers' });
  }
});

router.post('/request-ride', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as Request & { user?: AuthUser }).user!;
    const {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      baseFare = 200,
      customerId: bodyCustomerId,
    } = req.body;

    const customerId = user.role === 'admin' && bodyCustomerId ? bodyCustomerId : user.id;

    const [pickupDemand, dropoffDemand, serverDistanceKm] = await Promise.all([
      getZoneDemand(Number(pickupLat), Number(pickupLng)),
      getZoneDemand(Number(dropoffLat), Number(dropoffLng)),
      calculateDistanceKm(
        Number(pickupLat),
        Number(pickupLng),
        Number(dropoffLat),
        Number(dropoffLng),
      ),
    ]);

    if (serverDistanceKm < 0.1) {
      res.status(400).json({ message: 'Pickup and dropoff locations are too close.' });
      return;
    }

    const { fare, returnPremium } = calculateFare(
      Number(baseFare),
      pickupDemand,
      dropoffDemand,
      serverDistanceKm,
    );

    const ride = await prisma.rideRequest.create({
      data: {
        customerId,
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        dropoffLat: Number(dropoffLat),
        dropoffLng: Number(dropoffLng),
        status: RIDE_STATUS.searching,
        baseFare: Number(baseFare),
        returnPremium,
        totalFare: fare,
      },
    });

    res.status(201).json({
      message: 'Ride requested successfully',
      ride,
      metadata: { distanceKm: serverDistanceKm, pickupDemand, dropoffDemand },
    });
  } catch (error) {
    console.error('Failed to request ride:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/accept-ride', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, rideId } = req.body;

    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    if (!ride || ride.status !== RIDE_STATUS.searching) {
      res.status(400).json({ message: 'Ride no longer available' });
      return;
    }

    const updatedRide = await prisma.rideRequest.update({
      where: { id: rideId },
      data: { driverId, status: RIDE_STATUS.assigned },
    });

    if (req.app.get('io')) {
      req.app.get('io').emit(`ride_assigned_${ride.customerId}`, { ride: updatedRide });
    }

    res.status(200).json({ message: 'Ride accepted successfully', ride: updatedRide });
  } catch (error) {
    console.error('Failed to accept ride:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const TRANSITIONS: Record<string, RideStatus[]> = {
  assigned: [RIDE_STATUS.arrived, RIDE_STATUS.cancelled],
  arrived: [RIDE_STATUS.in_transit, RIDE_STATUS.cancelled],
  in_transit: [RIDE_STATUS.completed, RIDE_STATUS.cancelled],
  searching: [RIDE_STATUS.cancelled, RIDE_STATUS.assigned],
};

// Static paths before /:id
router.get('/customer/:customerId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as Request & { user?: AuthUser }).user!;
    const customerId = String(req.params.customerId);
    if (user.role !== 'admin' && user.id !== customerId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const rides = await prisma.rideRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.patch('/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const status = req.body.status as RideStatus;
    const ride = await prisma.rideRequest.findUnique({ where: { id } });
    if (!ride) {
      res.status(404).json({ message: 'Ride not found' });
      return;
    }

    const allowed = TRANSITIONS[ride.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        message: `Cannot transition from ${ride.status} to ${status}`,
        allowed,
      });
      return;
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: { status },
    });

    if (req.app.get('io')) {
      req.app.get('io').emit(`ride_status_${ride.customerId}`, { ride: updated });
      if (ride.driverId) {
        req.app.get('io').emit(`ride_status_driver_${ride.driverId}`, { ride: updated });
      }
    }

    res.json({ success: true, ride: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update ride status' });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: String(req.params.id) },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        driver: { include: { user: { select: { fullName: true, phone: true } } } },
      },
    });
    if (!ride) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
