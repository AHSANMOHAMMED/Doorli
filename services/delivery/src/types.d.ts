import { UserRole } from '@doorli/db';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string; // Used by routes
        userId: string; // Used by JWT
        phone: string;
        role: UserRole;
      };
    }
  }
}

