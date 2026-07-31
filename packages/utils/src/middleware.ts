import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Roles that exist on the platform.
 * Mirrors the Prisma UserRole enum — kept as a plain const so this package
 * does not need to import @doorli/db (avoids circular deps).
 */
export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin';

/** Shape attached to req.user after a valid JWT is verified. */
  export interface AuthUser {
    id: string;
    role: UserRole;
    phone?: string;
    email?: string;
    jti?: string;
  }

// Extend Express Request so TypeScript knows about req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * RBAC middleware factory.
 *
 * Usage:
 *   router.get('/admin/stuff', requireAuth(['admin']), handler)
 *   router.post('/orders',     requireAuth(['customer']), handler)
 *   router.patch('/drivers',   requireAuth(['driver', 'admin']), handler)
 *
 * Reads the JWT from the Authorization header ("Bearer <token>").
 * Returns:
 *   401 — missing or malformed token
 *   403 — valid token but role not in allowedRoles, or account inactive
 */
export function requireAuth(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthenticated', code: 'MISSING_TOKEN' });
      return;
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026';

    let payload: AuthUser;
    try {
      payload = jwt.verify(token, secret) as AuthUser;
    } catch (err) {
      const expired = err instanceof jwt.TokenExpiredError;
      res.status(401).json({
        error: expired ? 'Token expired' : 'Invalid token',
        code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      res.status(403).json({ error: 'Forbidden', code: 'INSUFFICIENT_ROLE' });
      return;
    }

    req.user = payload;
    next();
  };
}

/**
 * Convenience wrapper — allows any authenticated role.
 * Useful for routes that just need a valid login, regardless of role.
 */
export const requireAnyAuth = requireAuth([]);
