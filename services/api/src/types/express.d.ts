import type { UserRole } from '@doorli/types';

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

export {};
