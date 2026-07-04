import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { UserRole } from '@doorli/types';
import { env } from '../../config/env.js';
import { getRedis } from '../../lib/redis.js';

export interface TokenUser {
  id: string;
  phone: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function accessExpiresSeconds(): number {
  const match = env.JWT_ACCESS_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

export function signAccessToken(user: TokenUser): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ sub: user.id, phone: user.phone, role: user.role }, env.JWT_SECRET, options);
}

export function signRefreshToken(user: TokenUser): string {
  const jti = randomUUID();
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(
    { sub: user.id, phone: user.phone, role: user.role, jti },
    env.JWT_REFRESH_SECRET,
    options,
  );
}

export async function storeRefreshToken(refreshToken: string, userId: string): Promise<void> {
  const decoded = jwt.decode(refreshToken) as { jti?: string; exp?: number } | null;
  if (!decoded?.jti || !decoded.exp) return;

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return;

  const redis = getRedis();
  await redis.set(`refresh:${decoded.jti}`, userId, 'EX', ttl);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { jti?: string };
  if (decoded.jti) {
    await getRedis().del(`refresh:${decoded.jti}`);
  }
}

export async function isRefreshTokenValid(refreshToken: string): Promise<TokenUser | null> {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      sub: string;
      phone: string;
      role: UserRole;
      jti?: string;
    };

    if (!payload.jti) return null;

    const stored = await getRedis().get(`refresh:${payload.jti}`);
    if (!stored || stored !== payload.sub) return null;

    return { id: payload.sub, phone: payload.phone, role: payload.role };
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): TokenUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      phone: string;
      role: UserRole;
    };
    return { id: payload.sub, phone: payload.phone, role: payload.role };
  } catch {
    return null;
  }
}

export async function createTokenPair(user: TokenUser): Promise<TokenPair> {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(refreshToken, user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiresSeconds(),
  };
}
