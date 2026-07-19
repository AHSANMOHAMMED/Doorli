import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { setSocketServer, registerSocketAuth } from './lib/socket.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setSocketServer(io);
registerSocketAuth(io);

// Delivery/Dispatch service proxy
app.use(
  '/api/v1/deliveries',
  createProxyMiddleware({
    target: process.env.DELIVERY_SERVICE_URL || 'http://localhost:8086',
    changeOrigin: true,
    pathRewrite: (path) => `/api/delivery${path}`,
  })
);

// Ride-hailing: use in-process /api/v1/rides (routes/index). Optional external service:
if (process.env.RIDE_HAILING_SERVICE_URL) {
  app.use(
    '/api/v1/rides-proxy',
    createProxyMiddleware({
      target: process.env.RIDE_HAILING_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: (path) => `/api/rides${path}`,
    }),
  );
}

// Storage service proxy
app.use(
  '/api/v1/storage',
  createProxyMiddleware({
    target: process.env.STORAGE_SERVICE_URL || 'http://localhost:4005',
    changeOrigin: true,
    pathRewrite: (path) => `/api/storage${path}`,
  })
);

// Search service proxy
app.use(
  '/api/v1/search',
  createProxyMiddleware({
    target: process.env.SEARCH_SERVICE_URL || 'http://localhost:4004',
    changeOrigin: true,
    pathRewrite: (path) => `/api/search${path}`,
  })
);

// AI recommendations service proxy
app.use(
  '/api/v1/ai',
  createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || 'http://localhost:4006',
    changeOrigin: true,
    pathRewrite: (path) => `/api/ai${path}`,
  })
);

server.listen(env.API_PORT, () => {
  console.log(`Doorli API running on http://localhost:${env.API_PORT}`);
  console.log(`Swagger docs at http://localhost:${env.API_PORT}/api/docs`);
  console.log(`Socket.io ready on ws://localhost:${env.API_PORT}`);
});
