import { Router, Request, Response } from 'express';
import type { HealthCheckResponse } from '@doorli/types';
import { checkDatabaseConnection } from '../lib/db.js';
import { checkRedisConnection } from '../lib/redis.js';
import { authRouter } from '../modules/auth/index.js';
import { usersRouter } from '../modules/users/index.js';
import { vendorsRouter } from '../modules/vendors/index.js';
import { productsRouter } from '../modules/products/index.js';
import { ordersRouter } from '../modules/orders/index.js';
import { driversRouter } from '../modules/drivers/index.js';
import { bookingsRouter } from '../modules/bookings/index.js';
import { serviceRequestsRouter } from '../modules/service-requests/index.js';
import { reviewsRouter } from '../modules/reviews/index.js';
import { paymentsRouter } from '../modules/payments/index.js';
import promosRouter from '../modules/promos/promos.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';
import loyaltyRouter from '../modules/loyalty/loyalty.routes.js';
import subscriptionsRouter from '../modules/subscriptions/subscriptions.routes.js';
import eventsRouter from '../modules/events/events.routes.js';
import citiesRouter from '../modules/cities/cities.routes.js';
import recommendationsRouter from '../modules/recommendations/recommendations.routes.js';
import flashSalesRouter from '../modules/flash-sales/flash-sales.routes.js';
import ridesRouter from '../modules/rides/rides.routes.js';
import posRouter from '../modules/pos/pos.routes.js';
import purchasesRouter from '../modules/purchases/purchases.routes.js';

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
router.use('/api/v1/vendors', vendorsRouter);
router.use('/api/v1/products', productsRouter);
router.use('/api/v1/orders', ordersRouter);
router.use('/api/v1/drivers', driversRouter);
router.use('/api/v1/bookings', bookingsRouter);
router.use('/api/v1/service-requests', serviceRequestsRouter);
router.use('/api/v1/reviews', reviewsRouter);
router.use('/api/v1/payments', paymentsRouter);
router.use('/api/v1/promos', promosRouter);
router.use('/api/v1/admin', adminRouter);
router.use('/api/v1/loyalty', loyaltyRouter);
router.use('/api/v1/subscriptions', subscriptionsRouter);
router.use('/api/v1/events', eventsRouter);
router.use('/api/v1/cities', citiesRouter);
router.use('/api/v1/recommendations', recommendationsRouter);
router.use('/api/v1/flash-sales', flashSalesRouter);
router.use('/api/v1/rides', ridesRouter);
router.use('/api/v1/pos', posRouter);
router.use('/api/v1/purchases', purchasesRouter);

export default router;
