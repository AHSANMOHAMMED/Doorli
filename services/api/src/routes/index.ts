import { Router, Request, Response } from 'express';
import type { HealthCheckResponse } from '@doorli/types';
import { checkDatabaseConnection } from '../lib/db.js';
import { checkRedisConnection } from '../lib/redis.js';
import { authRouter } from '../modules/auth/index.js';
import { usersRouter } from '../modules/users/index.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const [db, redis] = await Promise.all([checkDatabaseConnection(), checkRedisConnection()]);

  const response: HealthCheckResponse = {
    status: db && redis ? 'ok' : db || redis ? 'degraded' : 'error',
    db,
    redis,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };

  const statusCode = response.status === 'error' ? 503 : 200;
  res.status(statusCode).json(response);
});

router.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Doorli API',
      version: '0.1.0',
      description: 'Everything Local. Delivered.',
    },
  });
});

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/users', usersRouter);

export default router;
