import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, toPublicUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';

const BCRYPT_ROUNDS = 12;
// Used so a login for an unknown email takes about as long as a real one (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});

/** Public signup. The role is ALWAYS customer. Trainers and admins are created by seed/admin only. */
export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const exists = await User.exists({ email });
  if (exists) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists', [
      { path: 'email', message: 'This email is already registered' },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'customer' });

  res.status(201).json({
    token: signToken({ sub: user._id.toString(), role: user.role }),
    user: toPublicUser(user),
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  res.json({
    token: signToken({ sub: user._id.toString(), role: user.role }),
    user: toPublicUser(user),
  });
};

export const me: RequestHandler = async (req, res) => {
  const user = await User.findById(req.auth?.id);
  if (!user || !user.isActive) {
    throw new AppError(401, 'INVALID_TOKEN', 'Your session is no longer valid');
  }
  res.json({ user: toPublicUser(user) });
};