import express, { Router, Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
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
import walletRouter from '../modules/wallet/wallet.routes.js';
import billsRouter from '../modules/bills/bills.routes.js';
import transitRouter from '../modules/transit/transit.routes.js';
import healthRouter from '../modules/health/health.routes.js';
import courierRouter, { errandsRouter } from '../modules/courier/courier.routes.js';
import communityRouter from '../modules/community/community.routes.js';
import membershipRouter from '../modules/membership/membership.routes.js';
import assistantRouter from '../modules/assistant/assistant.routes.js';

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

// Express strips the mount prefix (e.g. `/api/v1/auth`) from req.url before the
// proxy middleware runs, so pathRewrite sees only the remainder (e.g. `/login`).
// The rewrite must therefore PREPEND the backend's expected prefix.
// Auth Microservice Proxy (Port 4001)
router.use('/api/v1/auth', express.json(), createProxyMiddleware({
  target: env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/auth${path}`,
  on: { proxyReq: fixRequestBody },
}));

// Delivery Microservice Proxy
const deliveryProxy = (prefix: string) => createProxyMiddleware({
  target: env.DELIVERY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `${prefix}${path}`,
  on: { proxyReq: fixRequestBody },
});

router.use('/api/v1/orders', deliveryProxy('/orders'));
router.use('/api/v1/drivers', deliveryProxy('/drivers'));
router.use('/api/v1/payments', deliveryProxy('/payments'));

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
router.use('/api/v1/wallet', walletRouter);
router.use('/api/v1/billers', billsRouter);
router.use('/api/v1/bills', billsRouter);
router.use('/api/v1/transit', transitRouter);
router.use('/api/v1/health', healthRouter);
router.use('/api/v1/courier', courierRouter);
router.use('/api/v1/errands', errandsRouter);
router.use('/api/v1/community', communityRouter);
router.use('/api/v1/membership', membershipRouter);
router.use('/api/v1/assistant', assistantRouter);

// ==========================================
// STANDALONE SERVICE PROXY ROUTES
// ==========================================

// GovTech Microservice Proxy (Port 8089)
router.use('/api/v1/gov', createProxyMiddleware({
  target: env.GOV_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/api/v1/gov${path}`,
}));

// Forum Microservice Proxy (Port 8087)
router.use('/api/v1/forums', createProxyMiddleware({
  target: env.FORUM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => path,
}));

// Emergency Microservice Proxy (Port 8088)
router.use('/api/v1/emergency', createProxyMiddleware({
  target: env.EMERGENCY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => path,
}));

// Notifications Microservice Proxy (Port 4007)
// Keep read/read-state operations in the Marketplace database routes below;
// only enqueue operations belong to the notification worker.
router.use('/api/v1/notifications/enqueue', createProxyMiddleware({
  target: env.NOTIFICATIONS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/api/notifications/enqueue${path}`,
}));

// Search Service Proxy (Port 4004)
router.use('/api/search', createProxyMiddleware({
  target: env.SEARCH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/api/search${path}`,
}));

// ==========================================
// NOTIFICATION READ ENDPOINTS (API Monolith)
// ==========================================
router.get('/api/v1/notifications', authenticateToken, async (req, res, next) => {
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

router.patch('/api/v1/notifications/:id/read', authenticateToken, async (req, res, next) => {
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

router.patch('/api/v1/notifications/read-all', authenticateToken, async (req, res, next) => {
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
