import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import emergencyRoutes from './routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/', emergencyRoutes);

  // Health check
  app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'emergency-service' });
  });

  return app;
}
