import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../lib/redis.js';
import { AppError } from './errorHandler.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'ratelimit:',
  message: 'Too many requests, please try again later',
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests, keyPrefix, message } = { ...defaultConfig, ...config };

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedis();

    if (redis.status !== 'ready') {
      return next();
    }

    const identifier = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
    const key = `${keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substr(2, 9)}`);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        return next();
      }

      const requestCount = results[2][1] as number;

      if (requestCount > maxRequests) {
        const retryAfter = Math.ceil((windowMs - (now - windowStart)) / 1000);
        _res.setHeader('Retry-After', retryAfter);
        _res.setHeader('X-RateLimit-Limit', maxRequests);
        _res.setHeader('X-RateLimit-Remaining', 0);
        _res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));

        return next(new AppError(429, message || 'Too many requests'));
      }

      _res.setHeader('X-RateLimit-Limit', maxRequests);
      _res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
      _res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'ratelimit:auth:',
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 500,
  keyPrefix: 'ratelimit:api:',
  message: 'Too many requests, please try again later',
});

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'ratelimit:order:',
  message: 'Too many order attempts, please try again later',
});
