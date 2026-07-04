import { prisma, UserRole } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { generateOtpCode, storeOtp, verifyOtp } from './otp.service.js';
import { sendOtpSms } from './sms.service.js';
import { createTokenPair, revokeRefreshToken, isRefreshTokenValid } from './jwt.service.js';
import type { SendOtpInput, VerifyOtpInput } from './auth.schema.js';

export async function sendOtp(input: SendOtpInput): Promise<{ message: string }> {
  const code = generateOtpCode();
  await storeOtp(input.phone, code);
  await sendOtpSms(input.phone, code);
  return { message: 'OTP sent successfully' };
}

export async function verifyOtpAndLogin(input: VerifyOtpInput) {
  const valid = await verifyOtp(input.phone, input.code);
  if (!valid) {
    throw new AppError(401, 'Invalid or expired OTP');
  }

  let user = await prisma.user.findUnique({ where: { phone: input.phone } });

  if (!user) {
    if (!input.fullName) {
      throw new AppError(400, 'fullName is required for new users');
    }

    user = await prisma.user.create({
      data: {
        phone: input.phone,
        fullName: input.fullName,
        role: input.role as UserRole,
        isVerified: true,
      },
    });

    if (input.role === 'driver') {
      await prisma.driver.create({
        data: { userId: user.id, vehicleType: 'bike' },
      });
    }

    if (input.role === 'vendor') {
      // Vendor profile created during onboarding (Week 5–6)
    }
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  const tokens = await createTokenPair({
    id: user.id,
    phone: user.phone,
    role: user.role as 'customer' | 'vendor' | 'driver' | 'admin',
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const user = await isRefreshTokenValid(refreshToken);
  if (!user) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  await revokeRefreshToken(refreshToken);
  return createTokenPair(user);
}

export async function logout(refreshToken: string): Promise<{ message: string }> {
  await revokeRefreshToken(refreshToken);
  return { message: 'Logged out successfully' };
}
