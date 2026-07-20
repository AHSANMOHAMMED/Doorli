import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { initiatePaymentSchema, refundPaymentSchema } from './payments.schema.js';
import * as paymentsService from './payments.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const paymentsRouter = Router();

function validate<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError(400, err.errors.map((e) => e.message).join(', ')));
      } else {
        next(new AppError(400, 'Validation failed'));
      }
    }
  };
}

// Webhooks must be public (no JWT)
paymentsRouter.post('/webhook/:gateway', async (req, res, next) => {
  try {
    const { gateway } = req.params;
    const signature =
      (req.headers['stripe-signature'] as string) ||
      (req.headers['x-signature'] as string) ||
      '';
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const result = await paymentsService.handleWebhook(gateway, req.body, signature, rawBody);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.use(authenticateToken);

paymentsRouter.post('/initiate', validate(initiatePaymentSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const payment = await paymentsService.initiatePayment(req.user.id, req.body);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post('/collect-cod-for-order', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const orderId = String(req.body?.orderId || '');
    if (!orderId) throw new AppError(400, 'orderId required');
    const payment = await paymentsService.collectCodForOrder(orderId, req.user.role);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/by-reference/:referenceId', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const payment = await paymentsService.getPaymentByReference(
      req.params.referenceId,
      req.user.id,
      req.user.role,
    );
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post('/:id/collect-cod', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const payment = await paymentsService.collectCodPayment(req.params.id, req.user.role);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post('/:id/confirm-dev', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const payment = await paymentsService.confirmPaymentDev(req.params.id);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const payment = await paymentsService.getPaymentById(
      req.params.id as string,
      req.user.id,
      req.user.role,
    );
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post('/refund', validate(refundPaymentSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const payment = await paymentsService.refundPayment(req.body.paymentId, req.body, req.user.role);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

export default paymentsRouter;
