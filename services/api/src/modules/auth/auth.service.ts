import bcrypt from 'bcryptjs';
import { prisma, UserRole, VendorCategory } from '@doorli/db';
import { AppError } from '../../middleware/errorHandler.js';
import { generateOtpCode, storeOtp, verifyOtp } from './otp.service.js';
import { sendOtpSms } from './sms.service.js';
import { createTokenPair, revokeRefreshToken, isRefreshTokenValid } from './jwt.service.js';
import type {
  SendOtpInput,
  VerifyOtpInput,
  PasswordLoginInput,
  RegisterCustomerInput,
  RegisterVendorInput,
} from './auth.schema.js';

const BCRYPT_ROUNDS = 10;

function publicUser(user: {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  role: UserRole;
  isVerified: boolean;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    username: user.username,
    role: user.role,
    isVerified: user.isVerified,
  };
}

async function issueTokens(user: {
  id: string;
  phone: string | null;
  role: UserRole;
  fullName: string;
  email: string | null;
  username: string | null;
  isVerified: boolean;
}) {
  const tokens = await createTokenPair({
    id: user.id,
    phone: user.phone || user.email || user.username || user.id,
    role: user.role as 'customer' | 'vendor' | 'driver' | 'admin',
  });
  return {
    user: publicUser(user),
    ...tokens,
  };
}

async function findUserByIdentifier(identifier: string) {
  const id = identifier.trim();
  const lower = id.toLowerCase();

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: lower, mode: 'insensitive' } },
        { username: { equals: lower, mode: 'insensitive' } },
        { phone: id },
      ],
    },
    include: { vendor: true },
  });
}

export async function sendOtp(
  input: SendOtpInput,
): Promise<{ message: string; code?: string }> {
  const code = generateOtpCode();
  await storeOtp(input.phone, code);
  await sendOtpSms(input.phone, code);
  const expose = process.env.NODE_ENV !== 'production' || !process.env.MSG91_API_KEY;
  return {
    message: 'OTP sent successfully',
    ...(expose ? { code } : {}),
  };
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
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  return issueTokens(user);
}

export async function loginWithPassword(input: PasswordLoginInput) {
  const user = await findUserByIdentifier(input.identifier);
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid credentials');
  }
  if (!user.isActive) {
    throw new AppError(403, 'Account is disabled');
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, 'Invalid credentials');
  }

  const expected = input.expectedRole;
  if (expected === 'customer') {
    if (user.role !== 'customer') {
      throw new AppError(403, 'This login is for customers only. Use the vendor portal for seller accounts.');
    }
  } else if (expected === 'vendor') {
    if (user.role !== 'vendor' && user.role !== 'admin') {
      throw new AppError(403, 'This login is for vendors only. Use the customer app for shoppers.');
    }
    if (user.role === 'vendor') {
      const key = (input.businessKey || '').trim();
      if (!key) {
        throw new AppError(400, 'Business name or vendor ID is required');
      }
      const vendor = user.vendor;
      if (!vendor) {
        throw new AppError(403, 'No business profile linked to this account');
      }
      const keyLower = key.toLowerCase();
      const nameMatch = vendor.businessName.toLowerCase() === keyLower;
      const idMatch = vendor.id.toLowerCase() === keyLower;
      if (!nameMatch && !idMatch) {
        throw new AppError(403, 'Business name or ID does not match this vendor account');
      }
    }
  } else if (user.role !== expected && user.role !== 'admin') {
    throw new AppError(403, `Access denied for role ${user.role}`);
  }

  return issueTokens(user);
}

export async function registerCustomer(input: RegisterCustomerInput) {
  const email = input.email.trim().toLowerCase();
  const username = input.username?.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(username ? [{ username }] : []),
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
  });
  if (existing) {
    throw new AppError(409, 'An account with this email, username, or phone already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      username: username || null,
      phone: input.phone || null,
      passwordHash,
      role: UserRole.customer,
      isVerified: true,
    },
  });

  return issueTokens(user);
}

export async function registerVendor(input: RegisterVendorInput) {
  const email = input.email.trim().toLowerCase();
  const username = input.username?.trim().toLowerCase();
  const businessName = input.businessName.trim();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(username ? [{ username }] : []),
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
  });
  if (existing) {
    throw new AppError(409, 'An account with this email, username, or phone already exists');
  }

  const nameTaken = await prisma.vendor.findFirst({
    where: { businessName: { equals: businessName, mode: 'insensitive' } },
  });
  if (nameTaken) {
    throw new AppError(409, 'A business with this name already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: input.fullName.trim(),
        email,
        username: username || null,
        phone: input.phone || null,
        passwordHash,
        role: UserRole.vendor,
        isVerified: true,
      },
    });
    const vendor = await tx.vendor.create({
      data: {
        userId: user.id,
        businessName,
        category: input.category as VendorCategory,
        isVerified: false,
        isOpen: true,
      },
    });
    return { user, vendor };
  });

  const tokens = await issueTokens(result.user);
  return {
    ...tokens,
    vendor: {
      id: result.vendor.id,
      businessName: result.vendor.businessName,
      category: result.vendor.category,
    },
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
