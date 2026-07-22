import express from 'express';
import cors from 'cors';
import { govRoutes } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'gov-service' });
});

app.use('/api/v1/gov', govRoutes);

// Basic error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Gov Service Error]:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
