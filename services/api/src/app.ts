import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Doorli API',
    version: '0.1.0',
    description: 'Doorli community super-app API — Everything Local. Delivered.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development' }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { '200': { description: 'Service health status' } } },
    },
    '/api/v1': {
      get: { summary: 'API version info', responses: { '200': { description: 'Version metadata' } } },
    },
    '/api/v1/auth/send-otp': {
      post: { summary: 'Send phone OTP', responses: { '200': { description: 'OTP sent' } } },
    },
    '/api/v1/auth/verify-otp': {
      post: { summary: 'Verify OTP and login', responses: { '200': { description: 'JWT pair' } } },
    },
    '/api/v1/vendors/nearby': {
      get: { summary: 'Nearby vendors', responses: { '200': { description: 'Vendor list with distance' } } },
    },
    '/api/v1/orders': {
      post: { summary: 'Create order', responses: { '201': { description: 'Order created' } } },
    },
    '/api/v1/orders/estimate-fee': {
      get: { summary: 'Estimate delivery fee', responses: { '200': { description: 'Fee breakdown' } } },
    },
    '/api/v1/orders/driver': {
      get: { summary: 'Driver job list', responses: { '200': { description: 'Available and active jobs' } } },
    },
    '/api/v1/drivers/accept-delivery/{orderId}': {
      patch: { summary: 'Driver accepts delivery', responses: { '200': { description: 'Order assigned' } } },
    },
    '/api/v1/bookings': {
      post: { summary: 'Create booking', responses: { '200': { description: 'Booking created' } } },
    },
    '/api/v1/service-requests': {
      post: { summary: 'Create service request', responses: { '200': { description: 'Request created' } } },
    },
    '/api/v1/payments/initiate': {
      post: { summary: 'Initiate payment', responses: { '200': { description: 'Payment intent / COD' } } },
    },
  },
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Trust first proxy if behind reverse proxy
  
  app.use(
    helmet({
      // Allow browser fetches via nginx same-host and direct API access
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: true, credentials: true }));
  app.use(limiter); // Apply rate limiter to all requests globally

  // Stripe needs the raw body for signature verification
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {
        req.body = {};
      }
    }
    next();
  });

  app.use(express.json());
  app.use(requestLogger);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(routes);

  app.use(errorHandler);

  return app;
}
