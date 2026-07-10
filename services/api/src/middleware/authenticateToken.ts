import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@doorli/types';
import { verifyAccessToken } from '../modules/auth/jwt.service.js';
import { AppError } from './errorHandler.js';
import { getRedis } from '../lib/redis.js';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone?: string;
        email?: string;
        accountId?: string;
        tenantId?: string;
        isOwner?: boolean;
        role: UserRole | string;
      };
    }
  }
}

export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    // 1. Try standard Doorli Marketplace JWT
    const user = verifyAccessToken(token);
    if (user) {
      req.user = user;
      return next();
    }

    // 2. If it's not a standard JWT, check if it's an ERP company-session token
    const redis = getRedis();
    const cacheKey = `erp_auth:${token}`;
    
    // Check cache first to avoid hammering the ERP
    if (redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        req.user = JSON.parse(cached);
        return next();
      }
    }

    // 3. Introspect via ERP Internal API
    const response = await fetch(`${env.ERP_SERVICE_URL}/api/internal/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': env.ERP_INTERNAL_SECRET,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return next(new AppError(401, 'Invalid or expired token'));
    }

    const data = await response.json() as any;
    if (!data.valid || !data.user) {
      return next(new AppError(401, 'Invalid or expired token'));
    }

    req.user = data.user;

    // Cache the validated session for 5 minutes
    if (redis.status === 'ready') {
      await redis.setex(cacheKey, 300, JSON.stringify(data.user));
    }

    next();
  } catch (error) {
    console.error('Auth Bridge Error:', error);
    next(new AppError(500, 'Authentication service unavailable'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    const userRole = req.user.role as UserRole;
    if (!roles.includes(userRole)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
