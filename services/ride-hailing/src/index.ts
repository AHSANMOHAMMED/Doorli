import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calculateFare } from './pricingEngine';
import ridesRoutes from './routes/rides.routes';
import { prisma } from '@doorli/db';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

app.set('io', io);
app.use(express.json());

app.use('/api/rides', ridesRoutes);

app.post('/api/ride/estimate', (req, res) => {
  const { baseFare, pickupZoneDemand, dropoffZoneDemand, distanceKm } = req.body;
  const estimate = calculateFare(baseFare, pickupZoneDemand, dropoffZoneDemand, distanceKm);
  res.json(estimate);
});

// Endpoint to find nearby drivers via PostGIS
app.get('/api/ride/nearby-drivers', async (req, res) => {
  const { lat, lng, radiusKm = 5 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  try {
    // PostGIS ST_DWithin query to find online drivers within the radius
    const nearbyDrivers = await prisma.$queryRaw`
      SELECT 
        id, 
        user_id as "userId",
        current_latitude as "lat", 
        current_longitude as "lng",
        ST_Distance(
          location, 
          ST_SetSRID(ST_MakePoint(${parseFloat(lng as string)}, ${parseFloat(lat as string)}), 4326)
        ) as distance_meters
      FROM drivers 
      WHERE is_online = true 
        AND location IS NOT NULL
        AND ST_DWithin(
          location, 
          ST_SetSRID(ST_MakePoint(${parseFloat(lng as string)}, ${parseFloat(lat as string)}), 4326), 
          ${parseFloat(radiusKm as string) * 1000}
        )
      ORDER BY distance_meters ASC
      LIMIT 10;
    `;
    
    res.json({ success: true, drivers: nearbyDrivers });
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

io.on('connection', (socket) => {
  console.log(`[Ride-Hailing Socket] Client connected: ${socket.id}`);
  
  socket.on('join_driver', (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} went online and joined room.`);
  });
  
  socket.on('trigger_ride_assigned', (data) => {
    const { driverId, payload } = data;
    console.log(`[Ride-Hailing] Forwarding ride assignment to driver_${driverId}`);
    io.to(`driver_${driverId}`).emit(`ride_assigned_${driverId}`, payload);
  });
  
  socket.on('driver_location_update', async (data) => {
    const { driverId, lat, lng } = data;
    
    // Broadcast location to anyone subscribed to this driver (e.g. a customer on a ride)
    io.to(`driver_${driverId}`).emit('driver_location_changed', { driverId, lat, lng });
    
    try {
      // Update PostGIS location and current lat/lng in PostgreSQL
      await prisma.$executeRaw`
        UPDATE drivers 
        SET 
          current_latitude = ${lat}, 
          current_longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          last_location_update = NOW()
        WHERE id = ${driverId}::uuid
      `;
    } catch (err) {
      console.error(`Failed to update driver ${driverId} location in DB:`, err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Ride-Hailing Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8085;
httpServer.listen(PORT, () => {
  console.log(`Ride-Hailing service listening on port ${PORT}`);
});
