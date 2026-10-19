import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import type { Role } from '../models/User.js';
import { Society } from '../models/Society.js';
import { PricingConfig } from '../models/PricingConfig.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { DEFAULT_PEAK_WINDOWS } from '../services/pricing.service.js';

interface SeedUser {
  name: string;
  email: string;
  role: Role;
}

const SEED_USERS: SeedUser[] = [
  { name: 'Demo Admin', email: 'admin@demo.test', role: 'admin' },
  { name: 'Demo Customer', email: 'customer@demo.test', role: 'customer' },
  { name: 'Aarav Trainer', email: 'trainer1@demo.test', role: 'trainer' },
  { name: 'Diya Trainer', email: 'trainer2@demo.test', role: 'trainer' },
  { name: 'Kabir Trainer', email: 'trainer3@demo.test', role: 'trainer' },
];

const SEED_SOCIETIES = [
  { name: 'Prestige Ferns Residency', zoneId: 'zone-bangalore-south', address: 'HSR Layout, Bangalore', location: { lat: 12.9121, lng: 77.6445 }, commissionPercent: 10 },
  { name: 'Green Glen Layout', zoneId: 'zone-bangalore-east', address: 'Bellandur, Bangalore', location: { lat: 12.9279, lng: 77.6712 }, commissionPercent: 10 },
  { name: 'Palm Meadows', zoneId: 'zone-bangalore-east', address: 'Whitefield, Bangalore', location: { lat: 12.9698, lng: 77.7499 }, commissionPercent: 10 },
];

const SEED_PACKAGES = [
  { name: 'Starter Pack', sessions: 5, pricePaise: 189500, validityDays: 30, description: '5 sessions (5% discount included)' },
  { name: 'Pro Pack', sessions: 10, pricePaise: 359100, validityDays: 60, description: '10 sessions (10% discount included)' },
];

async function seed() {
  await connectDb();
  const passwordHash = await bcrypt.hash(env.SEED_PASSWORD, 12);

  for (const u of SEED_USERS) {
    const userDoc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { name: u.name, role: u.role, passwordHash, isActive: true } },
      { upsert: true, returnDocument: 'after' },
    );

    if (u.role === 'trainer') {
      await TrainerProfile.updateOne(
        { userId: userDoc._id.toString() },
        {
          $set: {
            zoneIds: ['zone-bangalore-south', 'zone-bangalore-east'],
            baseLocation: { lat: 12.9121, lng: 77.6445 },
            rating: 4.9,
            bio: `${u.name} is a certified fitness coach offering doorstep workouts.`,
            isActive: true,
            weeklyAvailability: [
              { weekday: 1, start: '06:00', end: '12:00' },
              { weekday: 1, start: '16:00', end: '20:00' },
              { weekday: 2, start: '06:00', end: '12:00' },
              { weekday: 2, start: '16:00', end: '20:00' },
              { weekday: 3, start: '06:00', end: '12:00' },
              { weekday: 3, start: '16:00', end: '20:00' },
              { weekday: 4, start: '06:00', end: '12:00' },
              { weekday: 4, start: '16:00', end: '20:00' },
              { weekday: 5, start: '06:00', end: '12:00' },
              { weekday: 5, start: '16:00', end: '20:00' },
              { weekday: 6, start: '07:00', end: '12:00' },
            ],
            timeOff: [],
          },
        },
        { upsert: true },
      );
    }
    console.log(`seeded user: ${u.role.padEnd(8)} ${u.email}`);
  }

  for (const s of SEED_SOCIETIES) {
    await Society.updateOne({ name: s.name }, { $set: { ...s, isActive: true } }, { upsert: true });
    console.log(`seeded society: ${s.name}`);
  }

  await PricingConfig.updateOne(
    { _id: 'default' },
    {
      $set: {
        normalPaise: 39900,
        peakPaise: 49900,
        commissionPercent: 10,
        timezone: 'Asia/Kolkata',
        peakWindows: DEFAULT_PEAK_WINDOWS,
        version: 1,
      },
    },
    { upsert: true },
  );

  for (const p of SEED_PACKAGES) {
    await PackageTemplate.updateOne({ name: p.name }, { $set: { ...p, isActive: true } }, { upsert: true });
  }

  await disconnectDb();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});