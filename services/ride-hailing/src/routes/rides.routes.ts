import { Router, Request, Response } from 'express';
import { prisma, RideStatus } from '@doorli/db';
import { calculateFare } from '../pricingEngine';

const router = Router();

// Geographic Demand lookup using PostGIS ST_Contains
const getZoneDemand = async (lat: number, lng: number): Promise<number> => {
  try {
    const result = await prisma.$queryRaw<Array<{ demand_level: number }>>`
      SELECT demand_level 
      FROM geographic_zones 
      WHERE ST_Contains(boundaries::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry)
      LIMIT 1
    `;
    return result.length > 0 ? result[0].demand_level : 1;
  } catch (error) {
    console.error("Error fetching zone demand:", error);
    return 1; // Default fallback demand
  }
};

// Calculate accurate geodetic distance in kilometers
const calculateDistanceKm = async (lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> => {
  try {
    const result = await prisma.$queryRaw<Array<{ dist_km: number }>>`
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(${lng1}, ${lat1}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng2}, ${lat2}), 4326)::geography
      ) / 1000 AS dist_km
    `;
    return result.length > 0 ? Number(result[0].dist_km) : 0;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0; // Fallback
  }
};

router.post('/request-ride', async (req: Request, res: Response): Promise<any> => {
  try {
    const { customerId, pickupLat, pickupLng, dropoffLat, dropoffLng, baseFare } = req.body;

    // Run spatial queries concurrently
    const [pickupDemand, dropoffDemand, serverDistanceKm] = await Promise.all([
      getZoneDemand(pickupLat, pickupLng),
      getZoneDemand(dropoffLat, dropoffLng),
      calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng)
    ]);

    // Safety check - prevent booking rides with no distance
    if (serverDistanceKm < 0.1) {
      return res.status(400).json({ message: 'Pickup and dropoff locations are too close.' });
    }

    const { fare, returnPremium } = calculateFare(baseFare, pickupDemand, dropoffDemand, serverDistanceKm);

    const ride = await prisma.rideRequest.create({
      data: {
        customerId,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        status: RideStatus.searching,
        baseFare,
        returnPremium,
        totalFare: fare,
      },
    });

    res.status(201).json({
      message: 'Ride requested successfully',
      ride,
      metadata: {
        distanceKm: serverDistanceKm,
        pickupDemand,
        dropoffDemand
      }
    });
  } catch (error) {
    console.error('Failed to request ride:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/accept-ride', async (req: Request, res: Response): Promise<any> => {
  try {
    const { driverId, rideId } = req.body;

    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    if (!ride || ride.status !== RideStatus.searching) {
      return res.status(400).json({ message: 'Ride no longer available' });
    }

    const updatedRide = await prisma.rideRequest.update({
      where: { id: rideId },
      data: {
        driverId,
        status: RideStatus.assigned,
      },
    });

    // We'd also update the driver's status to busy here if needed
    
    // Broadcast via socket would happen in the controller typically, or via Redis pub/sub
    if (req.app.get('io')) {
      req.app.get('io').emit(`ride_assigned_${ride.customerId}`, { ride: updatedRide });
    }

    res.status(200).json({
      message: 'Ride accepted successfully',
      ride: updatedRide,
    });
  } catch (error) {
    console.error('Failed to accept ride:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
