import { Request } from 'express';

export interface AuthUser {
  userId: string;
  role: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
