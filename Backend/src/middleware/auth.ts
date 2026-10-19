import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';
import type { Role } from '../models/User.js';

export interface AuthUser {
  id: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser;
  }
}

/** Requires a valid "Authorization: Bearer <jwt>" header. Sets req.auth. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue');
  }
  const payload = verifyToken(header.slice('Bearer '.length));
  if (!payload) {
    throw new AppError(401, 'INVALID_TOKEN', 'Your session has expired. Please log in again');
  }
  req.auth = { id: payload.sub, role: payload.role };
  next();
};

/** Use after requireAuth. Example: router.get('/x', requireAuth, requireRole('admin'), handler) */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    next();
  };
}
