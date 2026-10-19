import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}