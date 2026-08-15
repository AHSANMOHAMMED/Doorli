import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { renewPremiumSubscriptions } from './lib/premiumRenewal.js';

const app = createApp();
const server = http.createServer(app);

// WebSocket Proxy to Notifications Service
const wsProxy = createProxyMiddleware({
  target: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4007',
  changeOrigin: true,
  ws: true,
});
app.use('/socket.io', wsProxy);

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
    pathRewrite: (path) => path.replace(/^\/api\/v1\/search/, '/api/search'),
  })
);

// AI recommendations service proxy
app.use(
  '/api/v1/ai',
  createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || 'http://localhost:4008',
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/v1\/ai/, ''),
  })
);

// Forum service proxy
app.use(
  ['/api/v1/forums', '/api/v1/threads'],
  createProxyMiddleware({
    target: process.env.FORUM_SERVICE_URL || 'http://localhost:8087',
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/v1/, ''),
  })
);

// Emergency service proxy
app.use(
  ['/api/v1/incidents', '/api/v1/alerts', '/api/v1/sos'],
  createProxyMiddleware({
    target: process.env.EMERGENCY_SERVICE_URL || 'http://localhost:8088',
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/v1/, ''),
  })
);

// Gov service proxy
app.use(
  '/api/v1/gov',
  createProxyMiddleware({
    target: process.env.GOV_SERVICE_URL || 'http://localhost:8089',
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/v1\/gov/, '/api/v1/gov'),
  })
);

server.on('upgrade', wsProxy.upgrade!);

server.listen(env.API_PORT, () => {
  console.log(`Doorli API running on http://localhost:${env.API_PORT}`);
  console.log(`Swagger docs at http://localhost:${env.API_PORT}/api/docs`);
  console.log(`WebSocket proxy ready at ws://localhost:${env.API_PORT}/socket.io -> port 4007`);
  const runRenewals = () => void renewPremiumSubscriptions().catch((error) => console.error('[premium-renewal]', error));
  runRenewals();
  setInterval(runRenewals, 24 * 60 * 60 * 1000).unref();
});
