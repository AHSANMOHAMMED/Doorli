import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import ridesRoutes from './routes/rides.routes';
import { prisma } from '@doorli/db';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.set('io', io);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ride-hailing' });
});

app.use('/api/rides', ridesRoutes);

// Legacy path aliases
app.use('/api/ride', ridesRoutes);

io.on('connection', (socket) => {
  console.log(`[Ride-Hailing Socket] Client connected: ${socket.id}`);

  socket.on('join_driver', (driverId) => {
    socket.join(`driver_${driverId}`);
  });

  socket.on('subscribe_driver', (driverId: string) => {
    socket.join(`driver_${driverId}`);
  });

  socket.on('subscribe_ride', (rideId: string) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on('trigger_ride_assigned', (data) => {
    const { driverId, payload } = data;
    io.to(`driver_${driverId}`).emit(`ride_assigned_${driverId}`, payload);
  });

  socket.on('driver_location_update', async (data) => {
    const { driverId, lat, lng } = data;
    io.to(`driver_${driverId}`).emit('driver_location_changed', { driverId, lat, lng });
    try {
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
