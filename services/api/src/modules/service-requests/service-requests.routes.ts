import { Router, Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
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

// POST /service-requests — create new request (Req 6.1)
serviceRequestsRouter.post('/', validate(createServiceRequestSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const serviceRequest = await serviceRequestsService.createServiceRequest(req.user.id, req.body);
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

// GET /service-requests/nearby — providers see nearby open requests (Req 6.2)
serviceRequestsRouter.get('/nearby', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const { lat, lng, radius, serviceType } = req.query;
    if (!lat || !lng) {
      throw new AppError(400, 'Latitude and longitude required');
    }

    const serviceRequests = await serviceRequestsService.getNearbyServiceRequests(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10,
      serviceType ? String(serviceType) : undefined
    );
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

// GET /service-requests/my-requests — customer's own requests (Req 6.6)
serviceRequestsRouter.get('/my-requests', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'customer' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied. Customers only.');
    }
    const serviceRequests = await serviceRequestsService.getMyServiceRequests(
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

// GET /service-requests/provider — provider's assigned/open jobs (Req 6.7)
serviceRequestsRouter.get('/provider', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new AppError(403, 'Access denied. Providers only.');
    }
    const serviceRequests = await serviceRequestsService.getProviderServiceRequests(req.user.id);
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

// Kept for backward compatibility (serves both customer and vendor roles)
serviceRequestsRouter.get('/my-jobs', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (req.user.role === 'vendor' || req.user.role === 'admin') {
      const serviceRequests = await serviceRequestsService.getProviderServiceRequests(req.user.id);
      return res.json({ success: true, data: serviceRequests });
    }
    const serviceRequests = await serviceRequestsService.getMyServiceRequests(
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: serviceRequests });
  } catch (err) {
    next(err);
  }
});

// GET /service-requests/:id — get specific request
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

// PATCH /service-requests/:id/accept — provider accepts (Req 6.3)
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

// PATCH /service-requests/:id/start — provider starts job
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

// PATCH /service-requests/:id/complete — mark completed, notify customer (Req 6.4)
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

// PATCH /service-requests/:id/dispute — add evidence, flag for admin review (Req 6.5)
const disputeSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason'),
  mediaUrls: z.array(z.string().url()).min(1, 'At least one media URL required'),
});

serviceRequestsRouter.patch('/:id/dispute', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    let body: { reason: string; mediaUrls: string[] };
    try {
      body = disputeSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, err.errors.map((e) => e.message).join(', '));
      }
      throw new AppError(400, 'Validation failed');
    }

    const serviceRequest = await serviceRequestsService.disputeServiceRequest(
      req.params.id as string,
      req.user.id,
      req.user.role,
      body.mediaUrls,
      body.reason
    );
    res.json({ success: true, data: serviceRequest });
  } catch (err) {
    next(err);
  }
});

// PATCH /service-requests/:id/cancel — cancel a request
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
