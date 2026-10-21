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
import { CustomerPackage } from '../models/CustomerPackage.js';
import { Booking } from '../models/Booking.js';
import { SessionRecord } from '../models/SessionRecord.js';
import { SlotLock } from '../models/SlotLock.js';
import { AssignmentDecision } from '../models/AssignmentDecision.js';
import { PackageLedger } from '../models/PackageLedger.js';
import { Notification } from '../models/Notification.js';
import { Payment } from '../models/Payment.js';
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
  { name: 'Rohan Kapoor', email: 'customer3@demo.test', role: 'customer' },
  { name: 'Neha Reddy', email: 'customer4@demo.test', role: 'customer' },
  { name: 'Siddharth Nair', email: 'customer5@demo.test', role: 'customer' },
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
    bio: 'Strength & Conditioning specialist with 6+ years experience in personal training and hypertrophy.',
    zones: ['zone-bangalore-south', 'zone-bangalore-east'],
    lat: 12.9121,
    lng: 77.6445,
  },
  'trainer2@demo.test': {
    rating: 4.8,
    bio: 'Certified Yoga & Functional Mobility instructor focusing on core stabilization and injury rehab.',
    zones: ['zone-bangalore-east'],
    lat: 12.9279,
    lng: 77.6712,
  },
  'trainer3@demo.test': {
    rating: 5.0,
    bio: 'HIIT, Fat Loss, and Kettlebell conditioning coach dedicated to high energy, structured sessions.',
    zones: ['zone-bangalore-south'],
    lat: 12.9081,
    lng: 77.6841,
  },
  'trainer4@demo.test': {
    rating: 4.7,
    bio: 'Calisthenics and bodyweight strength coach specializing in movement quality and athletic speed.',
    zones: ['zone-bangalore-east'],
    lat: 12.9698,
    lng: 77.7499,
  },
  'trainer5@demo.test': {
    rating: 4.9,
    bio: 'Boxing & Endurance coach available round-the-clock for instant doorstep fitness bookings.',
    zones: ['zone-bangalore-south', 'zone-bangalore-east'],
    lat: 12.9150,
    lng: 77.6500,
    isAllDay: true,
  },
};

async function seed() {
  console.log('Connecting to database...');
  await connectDb();

  console.log('Clearing existing database collections and indexes...');
  await Promise.all([
    Booking.collection.dropIndexes().catch(() => {}),
    SlotLock.collection.dropIndexes().catch(() => {}),
    SessionRecord.collection.dropIndexes().catch(() => {}),
  ]);

  await Promise.all([
    User.deleteMany({}),
    Society.deleteMany({}),
    PricingConfig.deleteMany({}),
    PackageTemplate.deleteMany({}),
    TrainerProfile.deleteMany({}),
    CustomerProfile.deleteMany({}),
    FitnessAssessment.deleteMany({}),
    CustomerPackage.deleteMany({}),
    Booking.deleteMany({}),
    SessionRecord.deleteMany({}),
    SlotLock.deleteMany({}),
    AssignmentDecision.deleteMany({}),
    PackageLedger.deleteMany({}),
    Notification.deleteMany({}),
    Payment.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(env.SEED_PASSWORD || 'password123', 12);
  const createdUsers: Record<string, string> = {};

  for (const u of SEED_USERS) {
    const userDoc = await User.create({
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash,
      isActive: true,
    });

    createdUsers[u.email] = userDoc._id.toString();

    if (u.role === 'trainer' && TRAINER_DETAILS[u.email]) {
      const details = TRAINER_DETAILS[u.email]!;
      const weeklyAvailability = details.isAllDay
        ? [0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, start: '00:00', end: '23:59' }))
        : [0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, start: '05:00', end: '22:00' }));

      await TrainerProfile.create({
        userId: userDoc._id.toString(),
        zoneIds: details.zones,
        baseLocation: { lat: details.lat, lng: details.lng },
        rating: details.rating,
        bio: details.bio,
        isActive: true,
        weeklyAvailability,
        timeOff: [],
      });
    }
  }

  const createdSocieties: Record<string, any> = {};
  for (const s of SEED_SOCIETIES) {
    const soc = await Society.create({ ...s, isActive: true });
    createdSocieties[s.name] = soc;
  }

  const c1Id = createdUsers['customer@demo.test']!;
  const c2Id = createdUsers['customer2@demo.test']!;
  const c3Id = createdUsers['customer3@demo.test']!;
  const c4Id = createdUsers['customer4@demo.test']!;
  const c5Id = createdUsers['customer5@demo.test']!;

  const t1Id = createdUsers['trainer1@demo.test']!;
  const t2Id = createdUsers['trainer2@demo.test']!;
  const t3Id = createdUsers['trainer3@demo.test']!;
  const t4Id = createdUsers['trainer4@demo.test']!;
  const t5Id = createdUsers['trainer5@demo.test']!;

  const prestigeSoc = createdSocieties['Prestige Ferns Residency'];
  const greenGlenSoc = createdSocieties['Green Glen Layout'];
  const palmMeadowsSoc = createdSocieties['Palm Meadows'];
  const sobhaPavilionSoc = createdSocieties['Sobha Royal Pavilion'];

  await CustomerProfile.create({ userId: c1Id, societyId: prestigeSoc._id, flatNumber: 'B-304', phone: '+91 9876543210' });
  await CustomerProfile.create({ userId: c2Id, societyId: greenGlenSoc._id, flatNumber: 'A-102', phone: '+91 9123456789' });
  await CustomerProfile.create({ userId: c3Id, societyId: palmMeadowsSoc._id, flatNumber: 'Villa-45', phone: '+91 9988776655' });
  await CustomerProfile.create({ userId: c4Id, societyId: sobhaPavilionSoc._id, flatNumber: 'C-801', phone: '+91 9765432109' });
  await CustomerProfile.create({ userId: c5Id, societyId: prestigeSoc._id, flatNumber: 'E-1102', phone: '+91 9543210987' });

  await FitnessAssessment.create({
    customerId: c1Id,
    version: 1,
    age: 28,
    weightKg: 72,
    goals: ['Fat Loss', 'Strength'],
    level: 'intermediate',
    preferences: ['Strength Training', 'HIIT'],
    limitations: 'Mild lower back sensitivity when lifting heavy off the ground',
  });

  await FitnessAssessment.create({
    customerId: c2Id,
    version: 1,
    age: 34,
    weightKg: 61,
    goals: ['Flexibility & Mobility', 'General Fitness'],
    level: 'beginner',
    preferences: ['Yoga', 'Cardio'],
    limitations: 'Recovering from right wrist tendonitis',
  });

  await FitnessAssessment.create({
    customerId: c3Id,
    version: 1,
    age: 26,
    weightKg: 78,
    goals: ['Muscle Gain', 'Strength'],
    level: 'advanced',
    preferences: ['Strength Training', 'Bodyweight / Calisthenics'],
    limitations: 'None',
  });

  await FitnessAssessment.create({
    customerId: c4Id,
    version: 1,
    age: 31,
    weightKg: 65,
    goals: ['Fat Loss', 'Endurance'],
    level: 'beginner',
    preferences: ['Boxing / Kickboxing', 'HIIT'],
    limitations: 'Slight knee discomfort on high impact jumping moves',
  });

  await FitnessAssessment.create({
    customerId: c5Id,
    version: 1,
    age: 29,
    weightKg: 70,
    goals: ['General Fitness'],
    level: 'intermediate',
    preferences: ['Bodyweight / Calisthenics'],
    limitations: 'None',
  });

  await PricingConfig.create({
    _id: 'default',
    normalPaise: 39900,
    peakPaise: 49900,
    commissionPercent: 10,
    timezone: 'Asia/Kolkata',
    peakWindows: DEFAULT_PEAK_WINDOWS,
    version: 1,
  });

  const createdPackages: Record<string, any> = {};
  for (const p of SEED_PACKAGES) {
    const pkg = await PackageTemplate.create({ ...p, isActive: true });
    createdPackages[p.name] = pkg;
  }

  const pkgAarav = await CustomerPackage.create({
    customerId: c1Id,
    templateId: createdPackages['Pro Pack']._id,
    packageName: 'Pro Pack',
    totalSessions: 10,
    usedSessions: 3,
    purchasedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
  });

  const pkgPriya = await CustomerPackage.create({
    customerId: c2Id,
    templateId: createdPackages['Starter Pack']._id,
    packageName: 'Starter Pack',
    totalSessions: 5,
    usedSessions: 1,
    purchasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  });

  const pkgRohan = await CustomerPackage.create({
    customerId: c3Id,
    templateId: createdPackages['Elite Fitness Pass']._id,
    packageName: 'Elite Fitness Pass',
    totalSessions: 20,
    usedSessions: 1,
    purchasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 87 * 24 * 60 * 60 * 1000),
  });

  const now = new Date();

  // Booking 1: Completed (Aarav + Vikram)
  const b1Start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const b1End = new Date(b1Start.getTime() + 60 * 60 * 1000);
  const bk1 = await Booking.create({
    customerId: c1Id,
    trainerId: t1Id,
    societyId: prestigeSoc._id,
    mode: 'SCHEDULED',
    startAt: b1Start,
    endAt: b1End,
    status: 'COMPLETED',
    paymentMode: 'PACKAGE',
    packageId: pkgAarav._id.toString(),
    idempotencyKey: 'seed-bk-1',
    priceSnapshot: { tier: 'NORMAL', sessionPaise: 39900, commissionPaise: 3990, totalPaise: 43890, commissionPercent: 10, configVersion: 1 },
    session: { startedAt: b1Start, endsAt: b1End, completeFiredAt: b1End },
  });

  await SessionRecord.create({
    bookingId: bk1._id,
    customerId: c1Id,
    trainerId: t1Id,
    durationMinutes: 60,
    exercises: [
      { name: 'Goblet Squats', sets: 4, reps: 12, weightKg: 18 },
      { name: 'Push-ups', sets: 3, reps: 15 },
      { name: 'Dumbbell Bent-over Rows', sets: 3, reps: 12, weightKg: 14 },
    ],
    trainerNotes: 'Maintained pristine posture throughout goblet squats. Focused on core brace on rows.',
    suggestedNextWorkout: 'Upper Body Hypertrophy & Posterior Chain Strength',
    customerRating: 5,
    customerFeedback: 'Vikram was right on time and paid super close attention to my back posture. Fantastic session!',
  });

  // Booking 2: Completed (Priya + Ananya)
  const b2Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const b2End = new Date(b2Start.getTime() + 60 * 60 * 1000);
  const bk2 = await Booking.create({
    customerId: c2Id,
    trainerId: t2Id,
    societyId: greenGlenSoc._id,
    mode: 'SCHEDULED',
    startAt: b2Start,
    endAt: b2End,
    status: 'COMPLETED',
    paymentMode: 'PACKAGE',
    packageId: pkgPriya._id.toString(),
    idempotencyKey: 'seed-bk-2',
    priceSnapshot: { tier: 'PEAK', sessionPaise: 49900, commissionPaise: 4990, totalPaise: 54890, commissionPercent: 10, configVersion: 1 },
    session: { startedAt: b2Start, endsAt: b2End, completeFiredAt: b2End },
  });

  await SessionRecord.create({
    bookingId: bk2._id,
    customerId: c2Id,
    trainerId: t2Id,
    durationMinutes: 60,
    exercises: [
      { name: 'Sun Salutation Flow A', sets: 3, reps: 5 },
      { name: 'Warrior II & Reverse Warrior Hold', sets: 3, reps: 1 },
      { name: 'Thoracic Mobility & Bird-Dog', sets: 3, reps: 10 },
    ],
    trainerNotes: 'Modified palm grips to protect right wrist strain. Great balance progress on single leg holds.',
    suggestedNextWorkout: 'Gentle Mobility & Deep Hips Stretch',
    customerRating: 5,
    customerFeedback: 'Ananya customized the yoga routine so my wrist felt zero pain! Really grateful for her care.',
  });

  // Booking 3: Completed (Rohan K + Kabir)
  const b3Start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const b3End = new Date(b3Start.getTime() + 60 * 60 * 1000);
  const bk3 = await Booking.create({
    customerId: c3Id,
    trainerId: t3Id,
    societyId: palmMeadowsSoc._id,
    mode: 'INSTANT',
    startAt: b3Start,
    endAt: b3End,
    status: 'COMPLETED',
    paymentMode: 'PACKAGE',
    packageId: pkgRohan._id.toString(),
    idempotencyKey: 'seed-bk-3',
    priceSnapshot: { tier: 'NORMAL', sessionPaise: 39900, commissionPaise: 3990, totalPaise: 43890, commissionPercent: 10, configVersion: 1 },
    session: { startedAt: b3Start, endsAt: b3End, completeFiredAt: b3End },
  });

  await SessionRecord.create({
    bookingId: bk3._id,
    customerId: c3Id,
    trainerId: t3Id,
    durationMinutes: 60,
    exercises: [
      { name: 'Kettlebell Swings', sets: 5, reps: 20, weightKg: 24 },
      { name: 'Burpee Over KB', sets: 4, reps: 12 },
      { name: 'Renegade Rows', sets: 3, reps: 10, weightKg: 16 },
    ],
    trainerNotes: 'High exertion level. Rohan handled intense intervals with strong cardiovascular recovery.',
    suggestedNextWorkout: 'Legs & Lower Body Hypertrophy',
    customerRating: 4,
    customerFeedback: 'High intensity workout! Kabir pushed me right to my limit. Loved the kettlebell circuit.',
  });

  // Booking 4: In Progress (Aarav + Vikram)
  const b4Start = new Date(now.getTime() - 15 * 60 * 1000);
  const b4End = new Date(b4Start.getTime() + 60 * 60 * 1000);
  const bk4 = await Booking.create({
    customerId: c1Id,
    trainerId: t1Id,
    societyId: prestigeSoc._id,
    mode: 'INSTANT',
    startAt: b4Start,
    endAt: b4End,
    status: 'IN_PROGRESS',
    paymentMode: 'PACKAGE',
    packageId: pkgAarav._id.toString(),
    idempotencyKey: 'seed-bk-4',
    priceSnapshot: { tier: 'NORMAL', sessionPaise: 39900, commissionPaise: 3990, totalPaise: 43890, commissionPercent: 10, configVersion: 1 },
    session: { startedAt: b4Start, endsAt: b4End },
  });

  await SlotLock.create({ trainerId: t1Id, atomStart: b4Start, bookingId: bk4._id, state: 'CONFIRMED' });

  // Booking 5: Upcoming Confirmed (Priya + Ananya)
  const b5Start = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const b5End = new Date(b5Start.getTime() + 60 * 60 * 1000);
  const bk5 = await Booking.create({
    customerId: c2Id,
    trainerId: t2Id,
    societyId: greenGlenSoc._id,
    mode: 'SCHEDULED',
    startAt: b5Start,
    endAt: b5End,
    status: 'CONFIRMED',
    paymentMode: 'PACKAGE',
    packageId: pkgPriya._id.toString(),
    idempotencyKey: 'seed-bk-5',
    priceSnapshot: { tier: 'NORMAL', sessionPaise: 39900, commissionPaise: 3990, totalPaise: 43890, commissionPercent: 10, configVersion: 1 },
  });

  await SlotLock.create({ trainerId: t2Id, atomStart: b5Start, bookingId: bk5._id, state: 'CONFIRMED' });

  // Booking 6: Upcoming Confirmed (Neha + Sneha)
  const b6Start = new Date(now.getTime() + 44 * 60 * 60 * 1000);
  const b6End = new Date(b6Start.getTime() + 60 * 60 * 1000);
  const bk6 = await Booking.create({
    customerId: c4Id,
    trainerId: t4Id,
    societyId: sobhaPavilionSoc._id,
    mode: 'SCHEDULED',
    startAt: b6Start,
    endAt: b6End,
    status: 'CONFIRMED',
    paymentMode: 'PAYMENT',
    idempotencyKey: 'seed-bk-6',
    priceSnapshot: { tier: 'PEAK', sessionPaise: 49900, commissionPaise: 4990, totalPaise: 54890, commissionPercent: 10, configVersion: 1 },
  });

  await SlotLock.create({ trainerId: t4Id, atomStart: b6Start, bookingId: bk6._id, state: 'CONFIRMED' });

  // Booking 7: Cancelled Booking
  const b7Start = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const b7End = new Date(b7Start.getTime() + 60 * 60 * 1000);
  await Booking.create({
    customerId: c5Id,
    trainerId: t5Id,
    societyId: prestigeSoc._id,
    mode: 'SCHEDULED',
    startAt: b7Start,
    endAt: b7End,
    status: 'CANCELLED',
    paymentMode: 'PAYMENT',
    idempotencyKey: 'seed-bk-7',
    cancelledAt: new Date(now.getTime() - 75 * 60 * 60 * 1000),
    cancelReason: 'Work travel conflict',
    priceSnapshot: { tier: 'NORMAL', sessionPaise: 39900, commissionPaise: 3990, totalPaise: 43890, commissionPercent: 10, configVersion: 1 },
  });

  // Assignment Decisions for Admin Console
  await AssignmentDecision.create({
    bookingId: bk4._id,
    requestedAt: new Date(now.getTime() - 20 * 60 * 1000),
    slotStart: b4Start,
    societyId: prestigeSoc._id,
    candidates: [
      { trainerId: t1Id, trainerName: 'Vikram Singh', distanceKm: 0.2, sessionsToday: 2, rating: 4.9, eligible: true },
      { trainerId: t5Id, trainerName: 'Rohan Gupta', distanceKm: 0.8, sessionsToday: 1, rating: 4.9, eligible: true },
    ],
    chosenTrainerId: t1Id,
    outcome: 'ASSIGNED',
  });

  await AssignmentDecision.create({
    bookingId: bk5._id,
    requestedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    slotStart: b5Start,
    societyId: greenGlenSoc._id,
    candidates: [
      { trainerId: t2Id, trainerName: 'Ananya Rao', distanceKm: 0.1, sessionsToday: 1, rating: 4.8, eligible: true },
      { trainerId: t4Id, trainerName: 'Sneha Patel', distanceKm: 3.2, sessionsToday: 0, rating: 4.7, eligible: true },
    ],
    chosenTrainerId: t2Id,
    outcome: 'ASSIGNED',
  });

  // Package Ledgers & Notifications
  await PackageLedger.create({ packageId: pkgAarav._id, bookingId: bk1._id, type: 'CONSUME', sessionsCount: 1 });
  await PackageLedger.create({ packageId: pkgPriya._id, bookingId: bk2._id, type: 'CONSUME', sessionsCount: 1 });
  await PackageLedger.create({ packageId: pkgRohan._id, bookingId: bk3._id, type: 'CONSUME', sessionsCount: 1 });
  await PackageLedger.create({ packageId: pkgAarav._id, bookingId: bk4._id, type: 'CONSUME', sessionsCount: 1 });
  await PackageLedger.create({ packageId: pkgPriya._id, bookingId: bk5._id, type: 'CONSUME', sessionsCount: 1 });

  await Notification.create({
    userId: t1Id,
    type: 'BOOKING_ASSIGNED',
    bookingId: bk4._id,
    title: 'Live Instant Session Started',
    message: 'Doorstep workout in progress at Prestige Ferns Residency, Flat B-304.',
  });

  await Notification.create({
    userId: t2Id,
    type: 'BOOKING_ASSIGNED',
    bookingId: bk5._id,
    title: 'Upcoming Session Assigned',
    message: 'Workout scheduled for tomorrow at Green Glen Layout, Flat A-102.',
  });

  await Notification.create({
    userId: c1Id,
    type: 'SESSION_REMINDER',
    bookingId: bk4._id,
    title: 'Workout In Progress',
    message: 'Your 60-minute doorstep workout with Vikram Singh is currently active.',
  });

  await disconnectDb();
  console.log('Database successfully wiped and seeded with real synthetic data across all roles!');
}

seed().catch((err) => {
  console.error('Database seeding failed:', err);
  process.exit(1);
});