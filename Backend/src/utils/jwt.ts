import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../models/User.ts';

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN_SECONDS });
}

/** Returns the payload, or null if the token is invalid or expired. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string') return null;
    const { sub, role } = decoded;
    if (typeof sub !== 'string' || typeof role !== 'string') return null;
    return { sub, role: role as Role };
  } catch {
    return null;
  }
}