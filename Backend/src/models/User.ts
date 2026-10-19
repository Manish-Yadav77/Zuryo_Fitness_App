import { Schema, model } from 'mongoose';

export const ROLES = ['customer', 'trainer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'customer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model('User', userSchema);

/** The only shape of a user that ever leaves the API. Never includes passwordHash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString(),
  };
}