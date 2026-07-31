import { Request, Response, NextFunction } from 'express';

interface HelmetOptions {
  contentSecurityPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean | { policy: string };
  dnsPrefetchControl?: boolean;
  frameguard?: boolean;
  hidePoweredBy?: boolean;
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
  ieNoOpen?: boolean;
  noSniff?: boolean;
  referrerPolicy?: boolean | { policy: string };
  xssFilter?: boolean;
}

const defaultOptions: HelmetOptions = {
  contentSecurityPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};

export function helmet(options: HelmetOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (_req: Request, res: Response, next: NextFunction): void => {
    if (config.hidePoweredBy) {
      res.removeHeader('X-Powered-By');
    }

    if (config.contentSecurityPolicy) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';"
      );
    }

    if (config.crossOriginOpenerPolicy) {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }

    if (config.crossOriginResourcePolicy) {
      const policy = typeof config.crossOriginResourcePolicy === 'object'
        ? config.crossOriginResourcePolicy.policy
        : 'cross-origin';
      res.setHeader('Cross-Origin-Resource-Policy', policy);
    }

    if (config.dnsPrefetchControl) {
      res.setHeader('X-DNS-Prefetch-Control', 'off');
    }

    if (config.frameguard) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    if (config.hsts) {
      const hstsConfig = typeof config.hsts === 'object' ? config.hsts : {};
      const maxAge = hstsConfig.maxAge || 31536000;
      const includeSubDomains = hstsConfig.includeSubDomains !== false;
      const preload = hstsConfig.preload !== false;

      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) hstsValue += '; includeSubDomains';
      if (preload) hstsValue += '; preload';

      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    if (config.noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    if (config.ieNoOpen) {
      res.setHeader('X-Download-Options', 'noopen');
    }

    if (config.referrerPolicy) {
      const policy = typeof config.referrerPolicy === 'object'
        ? config.referrerPolicy.policy
        : 'strict-origin-when-cross-origin';
      res.setHeader('Referrer-Policy', policy);
    }

    if (config.xssFilter) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    next();
  };
}

export default helmet;
