import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createReviewSchema } from './reviews.schema.js';
import * as reviewsService from './reviews.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/authenticateToken.js';

const reviewsRouter = Router();

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

reviewsRouter.use(authenticateToken);

reviewsRouter.post('/', validate(createReviewSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const review = await reviewsService.createReview(req.user.id, req.body);
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const reviews = await reviewsService.getVendorReviews(req.params.vendorId as string);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const result = await reviewsService.deleteReview(
      req.params.id as string,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default reviewsRouter;
