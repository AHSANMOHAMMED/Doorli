import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e: any) {
      if (e && e.errors) {
        next(new AppError(400, e.errors.map((err: any) => err.message).join(', ')));
      } else {
        next(new AppError(400, 'Invalid request body'));
      }
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (e: any) {
      if (e && e.errors) {
        next(new AppError(400, e.errors.map((err: any) => err.message).join(', ')));
      } else {
        next(new AppError(400, 'Invalid request query params'));
      }
    }
  };
}

