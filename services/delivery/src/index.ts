import './config/env.js';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { startErpSyncWorker } from './lib/erpSyncQueue.js';

// Routers
import { ordersRouter } from './modules/orders/index.js';
import { paymentsRouter } from './modules/payments/index.js';
import { driversRouter } from './modules/drivers/index.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));

// Stripe webhook needs raw body
app.use('/payments/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'delivery' });
});

// Note: Gateway forwards /api/v1/... to /...
app.use('/orders', ordersRouter);
app.use('/payments', paymentsRouter);
app.use('/drivers', driversRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`🚚 [DELIVERY_SERVICE] Running on http://localhost:${PORT}`);
});

// ERP order-sync retry worker (BullMQ, Req 10.6)
startErpSyncWorker();
