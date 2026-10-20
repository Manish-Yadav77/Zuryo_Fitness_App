import { AppError } from './AppError.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/** Returns the value if it is a valid Mongo ObjectId string, otherwise throws a clean 404. */
export function requireObjectId(value: unknown, label = 'Record'): string {
  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw new AppError(404, 'NOT_FOUND', `${label} not found`);
  }
  return value;
}