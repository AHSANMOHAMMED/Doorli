import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  createServiceRequestSchema,
} from './service-requests.schema.js';
import * as serviceRequestsService from './service-requests.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const serviceRequestsRouter = Router();

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

serviceRequestsRouter.use(authenticateToken);

serviceRequestsRouter.post('/', validate(createServiceRequestSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const serviceRequest = await serviceRequestsService.createServiceRequest(req.user.id, req.body);
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.get('/nearby', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      throw new AppError(400, 'Latitude and longitude required');
    }

    const serviceRequests = await serviceRequestsService.getNearbyServiceRequests(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10
    );
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.get('/my-jobs', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const serviceRequests = await serviceRequestsService.getMyServiceRequests(req.user.id, req.user.role);
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const serviceRequest = await serviceRequestsService.getServiceRequestById(
      req.params.id as string,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.patch('/:id/accept', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const serviceRequest = await serviceRequestsService.acceptServiceRequest(
      req.params.id as string,
      req.user.id
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.patch('/:id/start', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const serviceRequest = await serviceRequestsService.startServiceRequest(
      req.params.id as string,
      req.user.id
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.patch('/:id/complete', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const serviceRequest = await serviceRequestsService.completeServiceRequest(
      req.params.id as string,
      req.user.id
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

serviceRequestsRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const serviceRequest = await serviceRequestsService.cancelServiceRequest(
      req.params.id as string,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

export default serviceRequestsRouter;
