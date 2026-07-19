import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
  passwordLoginSchema,
  registerCustomerSchema,
  registerVendorSchema,
} from './auth.schema.js';
import * as authService from './auth.service.js';
import { AppError } from '../../middleware/errorHandler.js';

const authRouter = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

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

authRouter.use(authRateLimiter);

authRouter.post('/send-otp', validate(sendOtpSchema), async (req, res, next) => {
  try {
    const result = await authService.sendOtp(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-otp', validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyOtpAndLogin(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validate(passwordLoginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginWithPassword(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', validate(registerCustomerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerCustomer(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register-vendor', validate(registerVendorSchema), async (req, res, next) => {
  try {
    const result = await authService.registerVendor(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', validate(logoutSchema), async (req, res, next) => {
  try {
    const result = await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
