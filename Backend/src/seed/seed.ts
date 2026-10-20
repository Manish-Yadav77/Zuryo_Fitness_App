import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import type { Role } from '../models/User.js';
import { Society } from '../models/Society.js';
import { PricingConfig } from '../models/PricingConfig.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { CustomerProfile } from '../models/CustomerProfile.js';
import { FitnessAssessment } from '../models/FitnessAssessment.js';
import { DEFAULT_PEAK_WINDOWS } from '../services/pricing.service.js';

interface SeedUser {
  name: string;
  email: string;
  role: Role;
}

const SEED_USERS: SeedUser[] = [
  { name: 'Demo Admin', email: 'admin@demo.test', role: 'admin' },
  { name: 'Aarav Sharma', email: 'customer@demo.test', role: 'customer' },
  { name: 'Priya Verma', email: 'customer2@demo.test', role: 'customer' },
  { name: 'Vikram Singh', email: 'trainer1@demo.test', role: 'trainer' },
  { name: 'Ananya Rao', email: 'trainer2@demo.test', role: 'trainer' },
  { name: 'Kabir Mehta', email: 'trainer3@demo.test', role: 'trainer' },
  { name: 'Sneha Patel', email: 'trainer4@demo.test', role: 'trainer' },
  { name: 'Rohan Gupta', email: 'trainer5@demo.test', role: 'trainer' },
];

const SEED_SOCIETIES = [
  { name: 'Prestige Ferns Residency', zoneId: 'zone-bangalore-south', address: 'HSR Layout, Bangalore', location: { lat: 12.9121, lng: 77.6445 }, commissionPercent: 10 },
  { name: 'Green Glen Layout', zoneId: 'zone-bangalore-east', address: 'Bellandur, Bangalore', location: { lat: 12.9279, lng: 77.6712 }, commissionPercent: 10 },
  { name: 'Palm Meadows', zoneId: 'zone-bangalore-east', address: 'Whitefield, Bangalore', location: { lat: 12.9698, lng: 77.7499 }, commissionPercent: 10 },
  { name: 'Sobha Royal Pavilion', zoneId: 'zone-bangalore-south', address: 'Sarjapur Road, Bangalore', location: { lat: 12.9081, lng: 77.6841 }, commissionPercent: 10 },
];

const SEED_PACKAGES = [
  { name: 'Starter Pack', sessions: 5, pricePaise: 189500, validityDays: 30, description: '5 sessions (5% discount included)' },
  { name: 'Pro Pack', sessions: 10, pricePaise: 359100, validityDays: 60, description: '10 sessions (10% discount included)' },
  { name: 'Elite Fitness Pass', sessions: 20, pricePaise: 678300, validityDays: 90, description: '20 sessions (15% discount included)' },
];

const TRAINER_DETAILS: Record<string, { rating: number; bio: string; zones: string[]; lat: number; lng: number; isAllDay?: boolean }> = {
  'trainer1@demo.test': {
    rating: 4.9,
    bio: 'Strength & Conditioning specialist with 6+ years experience in personal training.',
    zones: ['zone-bangalore-south', 'zone-bangalore-east'],
    lat: 12.9121,
    lng: 77.6445,
  },
  'trainer2@demo.test': {
    rating: 4.8,
    bio: 'Certified Yoga & Functional Fitness instructor focusing on posture and core stability.',
    zones: ['zone-bangalore-east'],
    lat: 12.9279,
    lng: 77.6712,
  },
  'trainer3@demo.test': {
    rating: 5.0,
    bio: 'High Intensity Interval Training (HIIT) and Fat Loss coach.',
    zones: ['zone-bangalore-south'],
    lat: 12.9081,
    lng: 77.6841,
  },
  'trainer4@demo.test': {
    rating: 4.7,
    bio: 'Calisthenics and mobility coach specializing in bodyweight strength training.',
    zones: ['zone-bangalore-east'],
    lat: 12.9698,
    lng: 77.7499,
  },
  'trainer5@demo.test': {
    rating: 4.9,
    bio: 'All-day Boxing & Endurance coach available round-the-clock for instant bookings.',
    zones: ['zone-bangalore-south', 'zone-bangalore-east'],
    lat: 12.9150,
    lng: 77.6500,
    isAllDay: true,
  },
};

async function seed() {
  await connectDb();
  const passwordHash = await bcrypt.hash(env.SEED_PASSWORD, 12);

  const createdUsers: Record<string, string> = {};

  for (const u of SEED_USERS) {
    const userDoc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { name: u.name, role: u.role, passwordHash, isActive: true } },
      { upsert: true, returnDocument: 'after' },
    );

    createdUsers[u.email] = userDoc._id.toString();

    if (u.role === 'trainer' && TRAINER_DETAILS[u.email]) {
      const details = TRAINER_DETAILS[u.email]!;
      const weeklyAvailability = details.isAllDay
        ? [0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, start: '00:00', end: '23:59' }))
        : [
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
          ];

      await TrainerProfile.updateOne(
        { userId: userDoc._id.toString() },
        {
          $set: {
            zoneIds: details.zones,
            baseLocation: { lat: details.lat, lng: details.lng },
            rating: details.rating,
            bio: details.bio,
            isActive: true,
            weeklyAvailability,
            timeOff: [],
          },
        },
        { upsert: true },
      );
    }
    console.log(`seeded user: ${u.role.padEnd(8)} ${u.email}`);
  }

  const createdSocieties: Record<string, string> = {};
  for (const s of SEED_SOCIETIES) {
    const soc = await Society.findOneAndUpdate({ name: s.name }, { $set: { ...s, isActive: true } }, { upsert: true, returnDocument: 'after' });
    createdSocieties[s.name] = soc._id.toString();
    console.log(`seeded society: ${s.name}`);
  }

  const customerId = createdUsers['customer@demo.test'];
  const prestigeId = createdSocieties['Prestige Ferns Residency'];

  if (customerId && prestigeId) {
    await CustomerProfile.updateOne(
      { userId: customerId },
      { $set: { societyId: prestigeId, flatNumber: 'B-304', phone: '+91 9876543210' } },
      { upsert: true },
    );

    await FitnessAssessment.updateOne(
      { customerId, version: 1 },
      {
        $set: {
          age: 28,
          weightKg: 72,
          goals: ['Fat Loss', 'Strength'],
          level: 'intermediate',
          preferences: ['Strength Training', 'HIIT'],
          limitations: 'None',
        },
      },
      { upsert: true },
    );
    console.log('seeded customer profile & fitness assessment for customer@demo.test');
  }

  await PricingConfig.updateOne(
    { _id: 'default' },
    {
      $setOnInsert: {
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