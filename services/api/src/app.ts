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
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'Service health status' } },
      },
    },
    '/api/v1': {
      get: {
        summary: 'API version info',
        responses: { '200': { description: 'Version metadata' } },
      },
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
  
  app.use(helmet());
  app.use(cors());
  app.use(limiter); // Apply rate limiter to all requests globally
  
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(routes);

  app.use(errorHandler);

  return app;
}
