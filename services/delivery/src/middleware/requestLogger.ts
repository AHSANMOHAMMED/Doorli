import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, Green for OK
      const resetColor = '\x1b[0m';
      console.log(`[API Gateway] ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`);
    } else {
      console.log(`[API Gateway] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}
