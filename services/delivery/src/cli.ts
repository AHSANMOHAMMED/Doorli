import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { io as ClientIo } from 'socket.io-client';
import { createDispatchService } from './dispatch.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const port = process.env.PORT ?? 8086;

async function main() {
  const app = express();
  app.use(express.json());

  // Connect to Ride-Hailing service to broadcast new ride assignments
  // Use the internal network URL if available, otherwise fallback to localhost
  const rideHailingUrl = process.env.RIDE_HAILING_SERVICE_URL || 'http://localhost:8085';
  const socket = ClientIo(rideHailingUrl);

  socket.on('connect', () => {
    console.log(`[Delivery] Connected to Ride-Hailing Socket Server at ${rideHailingUrl}`);
  });

  const dispatch = createDispatchService(redisUrl, {
    emitNewJob: (driverUserId, payload) => {
      console.log(`[dispatch] offer → driver:${driverUserId}`, payload.orderNumber);
      
      // Emit the assignment event to the Ride-Hailing server
      // The driver app is listening to `ride_assigned_${driverUserId}`
      socket.emit(`trigger_ride_assigned`, {
        driverId: driverUserId,
        payload
      });
      
      // We'll also just emit it directly to the socket if it works as a generic room broadcast
      socket.emit(`ride_assigned_${driverUserId}`, payload); 
    },
  });

  const connected = await dispatch.connect();
  console.log(`Doorli Delivery Service — Redis: ${connected ? 'connected' : 'disconnected'}`);

  app.post('/api/delivery/dispatch/:orderId', async (req, res) => {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    try {
      console.log(`[Delivery API] Triggering dispatch for order: ${orderId}`);
      await dispatch.dispatchOrder(orderId);
      res.json({ success: true, message: 'Dispatch started' });
    } catch (error) {
      console.error('Dispatch error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.listen(port, () => {
    console.log(`Delivery microservice listening on port ${port}`);
    console.log('Dispatch API ready at POST /api/delivery/dispatch/:orderId');
  });
}

main().catch(console.error);
