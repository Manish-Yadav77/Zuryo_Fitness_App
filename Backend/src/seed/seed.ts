import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import type { Role } from '../models/User.js';

interface SeedUser {
  name: string;
  email: string;
  role: Role;
}

// Synthetic demo data only. All accounts share SEED_PASSWORD from .env (default Demo@12345).
const SEED_USERS: SeedUser[] = [
  { name: 'Demo Admin', email: 'admin@demo.test', role: 'admin' },
  { name: 'Demo Customer', email: 'customer@demo.test', role: 'customer' },
  { name: 'Aarav Trainer', email: 'trainer1@demo.test', role: 'trainer' },
  { name: 'Diya Trainer', email: 'trainer2@demo.test', role: 'trainer' },
  { name: 'Kabir Trainer', email: 'trainer3@demo.test', role: 'trainer' },
];

async function seed() {
  await connectDb();
  const passwordHash = await bcrypt.hash(env.SEED_PASSWORD, 12);

  for (const u of SEED_USERS) {
    await User.updateOne(
      { email: u.email },
      { $set: { name: u.name, role: u.role, passwordHash, isActive: true } },
      { upsert: true },
    );
    console.log(`seeded ${u.role.padEnd(8)} ${u.email}`);
  }

  await disconnectDb();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});