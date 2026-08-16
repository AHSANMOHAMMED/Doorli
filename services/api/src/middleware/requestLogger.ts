import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { observeRequest } from '../lib/metrics.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const correlationId = req.header('x-correlation-id')?.slice(0, 100) || randomUUID();
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    observeRequest(req.method, path, res.statusCode, duration / 1000);
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, Green for OK
      const resetColor = '\x1b[0m';
      console.log(`[API Gateway] ${correlationId} ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`);
    } else {
      console.log(`[API Gateway] ${correlationId} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}
