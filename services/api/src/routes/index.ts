import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { HealthCheckResponse } from '@doorli/types';
import { checkDatabaseConnection } from '../lib/db.js';
import { checkRedisConnection } from '../lib/redis.js';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { env } from '../config/env.js';

// Monolith routers
import { usersRouter } from '../modules/users/index.js';
import { vendorsRouter } from '../modules/vendors/index.js';
import { productsRouter } from '../modules/products/index.js';
import { bookingsRouter } from '../modules/bookings/index.js';
import { serviceRequestsRouter } from '../modules/service-requests/index.js';
import { reviewsRouter } from '../modules/reviews/index.js';
import promosRouter from '../modules/promos/promos.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';
import controlRouter from '../modules/admin/control.routes.js';
import loyaltyRouter from '../modules/loyalty/loyalty.routes.js';
import subscriptionsRouter from '../modules/subscriptions/subscriptions.routes.js';
import eventsRouter from '../modules/events/events.routes.js';
import citiesRouter from '../modules/cities/cities.routes.js';
import recommendationsRouter from '../modules/recommendations/recommendations.routes.js';
import flashSalesRouter from '../modules/flash-sales/flash-sales.routes.js';
import ridesRouter from '../modules/rides/rides.routes.js';
import posRouter from '../modules/pos/pos.routes.js';
import erpWebhooksRouter from '../modules/erp-webhooks/erp-webhooks.routes.js';
import supportRouter from '../modules/support/support.routes.js';
import reportsRouter from '../modules/reports/reports.routes.js';
import wishlistRouter from '../modules/wishlist/wishlist.routes.js';
import groupOrdersRouter from '../modules/group-orders/group-orders.routes.js';
import corporateRouter from '../modules/corporate/corporate.routes.js';

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
      name: 'Doorli API Gateway',
      version: '0.1.0',
      description: 'Microservices Gateway — Everything Local. Delivered.',
    },
  });
});

// ==========================================
// MICROSERVICES PROXY ROUTES
// ==========================================

// Auth Microservice Proxy (Port 4001)
router.use('/api/v1/auth', createProxyMiddleware({
  target: env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/auth' },
}));

// Delivery Microservice Proxy
const deliveryProxy = createProxyMiddleware({
  target: env.DELIVERY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => path.replace(/^\/api\/v1\/(orders|drivers|payments)/, '/$1'),
});

router.use('/api/v1/orders', deliveryProxy);
router.use('/api/v1/drivers', deliveryProxy);
router.use('/api/v1/payments', deliveryProxy);

// ==========================================
// MONOLITH ROUTES (To be migrated)
// ==========================================
router.use('/api/v1/users', usersRouter);
router.use('/api/v1/vendors', vendorsRouter);
router.use('/api/v1/products', productsRouter);
router.use('/api/v1/bookings', bookingsRouter);
router.use('/api/v1/service-requests', serviceRequestsRouter);
router.use('/api/v1/reviews', reviewsRouter);
router.use('/api/v1/promos', promosRouter);
router.use('/api/v1/admin', adminRouter);
router.use('/api/v1/admin/control', controlRouter);
router.use('/api/v1/loyalty', loyaltyRouter);
router.use('/api/v1/subscriptions', subscriptionsRouter);
router.use('/api/v1/events', eventsRouter);
router.use('/api/v1/cities', citiesRouter);
router.use('/api/v1/recommendations', recommendationsRouter);
router.use('/api/v1/flash-sales', flashSalesRouter);
router.use('/api/v1/rides', ridesRouter);
router.use('/api/v1/pos', posRouter);
router.use('/api/v1/erp-webhooks', erpWebhooksRouter);
router.use('/api/v1/support', supportRouter);
router.use('/api/v1/reports', reportsRouter);
router.use('/api/v1/wishlist', wishlistRouter);
router.use('/api/v1/group-orders', groupOrdersRouter);
router.use('/api/v1/corporate', corporateRouter);

// ==========================================
// STANDALONE SERVICE PROXY ROUTES
// ==========================================

// GovTech Microservice Proxy (Port 8089)
router.use('/api/v1/gov', createProxyMiddleware({
  target: env.GOV_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/gov': '/api/v1/gov' },
}));

// Forum Microservice Proxy (Port 8087)
router.use('/api/v1/forums', createProxyMiddleware({
  target: env.FORUM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/forums': '/' },
}));

// Emergency Microservice Proxy (Port 8088)
router.use('/api/v1/emergency', createProxyMiddleware({
  target: env.EMERGENCY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/emergency': '/' },
}));

// Notifications Microservice Proxy (Port 4007)
router.use('/api/v1/notifications', createProxyMiddleware({
  target: env.NOTIFICATIONS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/notifications': '' },
}));

// Search Service Proxy (Port 4004)
router.use('/api/search', createProxyMiddleware({
  target: env.SEARCH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/search': '/api/search' },
}));

// ==========================================
// NOTIFICATION READ ENDPOINTS (API Monolith)
// ==========================================
router.get('/notifications', authenticateToken, async (req, res, next) => {
  try {
    const cursor = (Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor) as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id as string },
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor } } : {}),
    });
    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    res.json({ success: true, data: { items, nextCursor, unreadCount: notifications.filter(n => !n.isRead).length } });
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/read-all', authenticateToken, async (req, res, next) => {
  try {
    const count = await prisma.notification.updateMany({
      where: { userId: req.user!.id as string, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, data: { updated: count.count } });
  } catch (err) {
    next(err);
  }
});

export default router;
