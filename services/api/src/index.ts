import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { setSocketServer } from './lib/socket.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  socket.on('join', (rooms: string | string[]) => {
    const list = Array.isArray(rooms) ? rooms : [rooms];
    for (const room of list) {
      if (typeof room === 'string' && room.length > 0) {
        socket.join(room);
      }
    }
  });
});

setSocketServer(io);

// Delivery/Dispatch service proxy
app.use(
  '/api/v1/deliveries',
  createProxyMiddleware({
    target: process.env.DELIVERY_SERVICE_URL || 'http://localhost:8086',
    changeOrigin: true,
  })
);

// Ride-Hailing service proxy
app.use(
  '/api/v1/rides',
  createProxyMiddleware({
    target: process.env.RIDE_HAILING_SERVICE_URL || 'http://localhost:8085',
    changeOrigin: true,
  })
);

// Storage service proxy
app.use(
  '/api/v1/storage',
  createProxyMiddleware({
    target: process.env.STORAGE_SERVICE_URL || 'http://localhost:4005',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/storage': '/api/storage' },
  })
);

// Search service proxy
app.use(
  '/api/v1/search',
  createProxyMiddleware({
    target: process.env.SEARCH_SERVICE_URL || 'http://localhost:4004',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/search': '/api/search' },
  })
);

// AI recommendations service proxy
app.use(
  '/api/v1/ai',
  createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || 'http://localhost:4006',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/ai': '/api/ai' },
  })
);

server.listen(env.API_PORT, () => {
  console.log(`Doorli API running on http://localhost:${env.API_PORT}`);
  console.log(`Swagger docs at http://localhost:${env.API_PORT}/api/docs`);
  console.log(`Socket.io ready on ws://localhost:${env.API_PORT}`);
});
