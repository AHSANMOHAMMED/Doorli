import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getRecommendations, analyzeReview } from './controllers.js';

const PORT = process.env.PORT || 4008;

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'ai-service' });
});

app.post('/recommendations', getRecommendations);
app.post('/analyze-review', analyzeReview);

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[AI Service Error]:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`AI service listening on port ${PORT}`);
});
