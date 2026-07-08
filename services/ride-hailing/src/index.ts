import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calculateFare } from './pricingEngine';
import ridesRoutes from './routes/rides.routes';

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

io.on('connection', (socket) => {
  console.log(`[Ride-Hailing Socket] Client connected: ${socket.id}`);
  
  socket.on('join_driver', (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} went online and joined room.`);
  });
  
  socket.on('disconnect', () => {
    console.log(`[Ride-Hailing Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8085;
httpServer.listen(PORT, () => {
  console.log(`Ride-Hailing service listening on port ${PORT}`);
});
