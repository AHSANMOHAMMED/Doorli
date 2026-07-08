import { Router, Request, Response } from 'express';
import { prisma, RideStatus } from '@doorli/db';
import { calculateFare } from '../pricingEngine';

const router = Router();

// Basic Geographic Demand lookup stub (in a real system, you'd use PostGIS to check if lat/lng falls in a GeographicZone)
const getZoneDemand = async (lat: number, lng: number): Promise<number> => {
  // Mock logic: randomly assign a demand between 1 and 5
  return Math.floor(Math.random() * 5) + 1;
};

router.post('/request-ride', async (req: Request, res: Response): Promise<any> => {
  try {
    const { customerId, pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm, baseFare } = req.body;

    const pickupDemand = await getZoneDemand(pickupLat, pickupLng);
    const dropoffDemand = await getZoneDemand(dropoffLat, dropoffLng);

    const { fare, returnPremium } = calculateFare(baseFare, pickupDemand, dropoffDemand, distanceKm);

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
