import { randomInt } from 'crypto';
import { getRedis } from '../../lib/redis.js';
import { env } from '../../config/env.js';

const OTP_PREFIX = 'otp:';

export function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export async function storeOtp(phone: string, code: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`${OTP_PREFIX}${phone}`, code, 'EX', env.OTP_TTL_SECONDS);
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const redis = getRedis();
  const stored = await redis.get(`${OTP_PREFIX}${phone}`);
  if (!stored || stored !== code) return false;
  await redis.del(`${OTP_PREFIX}${phone}`);
  return true;
}
