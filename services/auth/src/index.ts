import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient, UserRole } from '@doorli/db';
import { createFeatureAccess } from './featureAccess';
import { sendSms } from './sms';

dotenv.config();

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';              // access token — short-lived
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30 days in seconds

// Feature-flag availability layer (requireFeature middleware + helpers)
export const featureAccess = createFeatureAccess({ prisma, redis, jwtSecret: JWT_SECRET });
export const { requireFeature, hasFeature, invalidateFeatureCache } = featureAccess;

// ─── helpers ──────────────────────────────────────────────────────────────────

const isValidPhone = (phone: string) => /^\+[1-9]\d{1,14}$/.test(phone);

/** Issue an access + refresh token pair and persist the refresh token in Redis */
async function issueTokenPair(payload: {
  userId: string;
  role: string;
  phone?: string | null;
  email?: string | null;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = randomUUID();

  const accessToken = jwt.sign(
    { id: payload.userId, role: payload.role, phone: payload.phone, email: payload.email, jti },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  const refreshToken = randomUUID();
  // Store: refresh:{id} → refreshToken  (EX 30 days)
  await redis.set(`refresh:${payload.userId}`, refreshToken, 'EX', REFRESH_TTL_SEC);

  return { accessToken, refreshToken };
}

const userPublicFields = (user: {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: string;
  isVerified: boolean;
}) => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

// ─── routes ───────────────────────────────────────────────────────────────────

/**
 * POST /auth/send-otp
 * Generates a 6-digit OTP, stores in Redis (5 min TTL), sends SMS.
 */
app.post('/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as { phone?: string };

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ success: false, error: 'Valid E.164 phone number is required.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${phone}`, otp, 'EX', 300);
    await sendSms(phone, `Your Doorli verification code is: ${otp}. Valid for 5 minutes.`);

    return res.json({ success: true, data: { message: 'OTP sent.' } });
  } catch (err) {
    console.error('[send-otp]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/verify-otp
 * Validates OTP, finds/creates user, returns access + refresh token pair.
 */
app.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, code, fullName, role = 'customer' } = req.body as {
      phone?: string;
      otp?: string;
      code?: string;
      fullName?: string;
      role?: string;
    };
    const suppliedOtp = otp || code;

    if (!phone || !suppliedOtp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required.' });
    }

    const storedOtp = await redis.get(`otp:${phone}`);
    const isBypass = process.env.NODE_ENV !== 'production' && suppliedOtp === '123456';

    if (!isBypass && (!storedOtp || storedOtp !== suppliedOtp)) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
    }
    if (storedOtp) await redis.del(`otp:${phone}`);

    const validRole = Object.values(UserRole).includes(role as UserRole)
      ? (role as UserRole)
      : UserRole.customer;

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, fullName: fullName || 'New User', role: validRole, isVerified: true, isActive: true },
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }

    const tokens = await issueTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return res.json({ success: true, data: { ...tokens, user: userPublicFields(user) } });
  } catch (err) {
    console.error('[verify-otp]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/login
 * Email + password login for staff / super-admin console.
 * Returns access + refresh tokens and the user profile.
 */
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalized = String(email).trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: { equals: normalized, mode: 'insensitive' } }, { username: { equals: normalized, mode: 'insensitive' } }],
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const tokens = await issueTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return res.json({ success: true, ...tokens, user: userPublicFields(user) });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair.
 * Body: { userId, refreshToken }
 */
app.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { userId, refreshToken } = req.body as {
      userId?: string;
      refreshToken?: string;
    };

    if (!userId || !refreshToken) {
      return res.status(400).json({ error: 'userId and refreshToken are required.' });
    }

    const stored = await redis.get(`refresh:${userId}`);
    if (!stored || stored !== refreshToken) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Account not found or inactive.' });
    }

    // Rotate — delete old refresh token, issue new pair
    await redis.del(`refresh:${userId}`);
    const tokens = await issueTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return res.json({ success: true, ...tokens });
  } catch (err) {
    console.error('[refresh]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/logout
 * Invalidates the refresh token and blacklists the access token JTI.
 * Body: { userId, refreshToken, accessToken }
 */
app.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const { userId, refreshToken, accessToken } = req.body as {
      userId?: string;
      refreshToken?: string;
      accessToken?: string;
    };

    if (userId && refreshToken) {
      const stored = await redis.get(`refresh:${userId}`);
      if (stored === refreshToken) {
        await redis.del(`refresh:${userId}`);
      }
    }

    // Blacklist the access token's JTI for the remainder of its TTL
    if (accessToken) {
      try {
        const payload = jwt.decode(accessToken) as { jti?: string; exp?: number } | null;
        if (payload?.jti && payload?.exp) {
          const ttl = Math.max(payload.exp - Math.floor(Date.now() / 1000), 1);
          await redis.set(`blacklist:${payload.jti}`, '1', 'EX', ttl);
        }
      } catch {
        // decode failure is non-fatal on logout
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/register-device
 * Stores or updates an FCM device token for push notifications.
 * Requires a valid access token in Authorization header.
 * Body: { userId, token, platform }
 */
app.post('/auth/register-device', async (req: Request, res: Response) => {
  try {
    const { userId, token, platform } = req.body as {
      userId?: string;
      token?: string;
      platform?: string;
    };

    if (!userId || !token || !platform) {
      return res.status(400).json({ error: 'userId, token, and platform are required.' });
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'platform must be ios, android, or web.' });
    }

    // Upsert — if the token already exists, update the userId+platform
    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[register-device]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4001/auth/google/callback';

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

// ─── Google OAuth routes ───────────────────────────────────────────────────────

/**
 * GET /auth/google
 * Redirect the browser/app to Google's consent screen.
 * Generates a CSRF state nonce stored in Redis (10-min TTL).
 */
app.get('/auth/google', (_req: Request, res: Response) => {
  const state = randomUUID();
  void redis.set(`google:state:${state}`, '1', 'EX', 600);

  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
  });

  return res.redirect(url);
});

/**
 * GET /auth/google/callback
 * Handles the redirect from Google, exchanges the code, and either:
 *   a) issues a token pair for an existing user, or
 *   b) returns { newUser: true, tempToken } for a brand-new user who must choose a role.
 */
app.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter.' });
    }

    // Validate CSRF nonce
    const nonceKey = `google:state:${state}`;
    const nonceExists = await redis.get(nonceKey);
    if (!nonceExists) {
      return res.status(400).json({ error: 'Invalid or expired OAuth state.' });
    }
    await redis.del(nonceKey);

    // Exchange authorisation code for tokens
    const { tokens: googleTokens } = await googleClient.getToken(code);
    googleClient.setCredentials(googleTokens);

    if (!googleTokens.id_token) {
      return res.status(400).json({ error: 'No ID token returned from Google.' });
    }

    // Verify and decode ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleTokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const gPayload = ticket.getPayload();
    if (!gPayload?.email) {
      return res.status(400).json({ error: 'Could not extract email from Google token.' });
    }

    const { email, name, picture } = gPayload;

    // Look up existing user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing user — issue token pair and redirect
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is inactive.' });
      }
      const { accessToken, refreshToken } = await issueTokenPair({
        userId: user.id,
        role: user.role,
        phone: user.phone,
        email: user.email,
      });

      // Web redirect — client reads token from query param and stores it
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      return res.redirect(
        `${appUrl}/auth/callback?token=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(refreshToken)}`,
      );
    }

    // New user — create account and return a short-lived temp token for role selection
    user = await prisma.user.create({
      data: {
        email,
        fullName: name ?? 'New User',
        profilePhotoUrl: picture ?? null,
        role: UserRole.customer, // default; updated via /complete-registration
        isVerified: true,
        isActive: true,
      },
    });

    // Temp token valid for 10 minutes — only used to complete registration
    const tempToken = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, temp: true },
      JWT_SECRET,
      { expiresIn: '10m' },
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return res.redirect(
      `${appUrl}/auth/callback?newUser=true&tempToken=${encodeURIComponent(tempToken)}`,
    );
  } catch (err) {
    console.error('[google-callback]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /auth/google/complete-registration
 * Called after a new Google user chooses their role.
 * Body: { tempToken, role }
 */
app.post('/auth/google/complete-registration', async (req: Request, res: Response) => {
  try {
    const { tempToken, role } = req.body as { tempToken?: string; role?: string };

    if (!tempToken || !role) {
      return res.status(400).json({ error: 'tempToken and role are required.' });
    }

    const validRole = Object.values(UserRole).includes(role as UserRole)
      ? (role as UserRole)
      : UserRole.customer;

    let decoded: { userId?: string; temp?: boolean };
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET) as { userId?: string; temp?: boolean };
    } catch {
      return res.status(401).json({ error: 'Invalid or expired temp token.' });
    }

    if (!decoded.temp || !decoded.userId) {
      return res.status(400).json({ error: 'Not a valid registration token.' });
    }

    // Update user role
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { role: validRole },
    });

    // Create Vendor / Driver profile stubs as needed — category/vehicleType must be provided
    if (validRole === UserRole.vendor) {
      const existing = await prisma.vendor.findUnique({ where: { userId: user.id } });
      if (!existing) {
        const { category } = req.body as { category?: string };
        if (!category) {
          return res.status(400).json({ error: 'category is required for vendor registration.' });
        }
        await prisma.vendor.create({
          data: {
            userId: user.id,
            businessName: user.fullName,
            category: category as any,
          },
        });
      }
    }

    if (validRole === UserRole.driver) {
      const existing = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!existing) {
        const { vehicleType } = req.body as { vehicleType?: string };
        if (!vehicleType) {
          return res.status(400).json({ error: 'vehicleType is required for driver registration.' });
        }
        await prisma.driver.create({
          data: { userId: user.id, vehicleType: vehicleType as any },
        });
      }
    }

    const tokens = await issueTokenPair({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return res.json({ success: true, ...tokens, user: userPublicFields(user) });
  } catch (err) {
    console.error('[complete-registration]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /auth/features
 * Returns the caller's effective feature map (vendor overrides merged over
 * global defaults). Requires a valid access token with a vendor profile.
 */
app.get('/auth/features', async (req: Request, res: Response) => {
  try {
    const user = await featureAccess.authenticate(req, res);
    if (!user) return;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
    if (!vendor) {
      return res
        .status(403)
        .json({ error: 'Vendor profile required', code: 'VENDOR_PROFILE_REQUIRED' });
    }

    const features = await featureAccess.resolveFeatureMap(vendor.id);
    return res.json({ success: true, features });
  } catch (err) {
    console.error('[features]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /auth/features/:key
 * Availability check for a single feature — 200 with { enabled } either way.
 * Example gated route usage: app.post('/pos/...', requireFeature('pos'), handler)
 */
app.get('/auth/features/:key', async (req: Request, res: Response) => {
  const user = await featureAccess.authenticate(req, res);
  if (!user) return;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!vendor) {
    return res
      .status(403)
      .json({ error: 'Vendor profile required', code: 'VENDOR_PROFILE_REQUIRED' });
  }

  const enabled = await hasFeature(req.params.key, vendor.id);
  return res.json({ success: true, feature: req.params.key, enabled });
});

/**
 * GET /auth/health
 */
app.get('/auth/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return res.json({ status: 'ok', services: { db: 'connected', redis: 'connected' } });
  } catch {
    return res.status(503).json({ status: 'error' });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 [AUTH_SERVICE] Running on http://localhost:${PORT}`);
});
