# PROJECT STATE
Last updated: 19 Oct 2026   Last AI used: Gemini

## Phase checklist
- [x] 0 Foundation + Auth
- [x] 1 Seed data + Pricing Engine
- [x] 2 Assessment
- [x] 3 Trainers + Availability
- [x] 4 Booking Core & Concurrency Locks
- [ ] 5 Payments + Packages
- [ ] 6 Cancel/reschedule + Notifications
- [ ] 7 Session Timer
- [ ] 8 Records + AI
- [ ] 9 Admin Console
- [ ] 10 Tests, Docs, Deploy, Video

## ACHIEVEMENTS IN THIS STEP (Phase 3 & Phase 4)
- Built TrainerProfile schema with weekly recurring working windows and time-off exception blocks.
- Added 15-minute discrete time atom calculation helpers (`time.ts`) and geo-distance Haversine calculations (`geo.ts`).
- Created `SlotLock` database model with a compound unique index on `(trainerId, atomStart)` to physically prevent double bookings at the database level.
- Built auto-assignment algorithm in `assignment.service.ts` ranking eligible trainers by preferred trainer request, distance, session load balancing, and rating.
- Implemented `Booking` and `AssignmentDecision` models supporting Instant (starts within 60 mins) and Scheduled booking modes.
- Added `Idempotency-Key` header verification on booking requests to prevent double-charging on duplicate network retries.
- Built frontend slot selection grid, preferred trainer dropdown, price quote breakdown, and customer booking management views (`BookPage.tsx`, `MyBookingsPage.tsx`, `BookingDetailPage.tsx`).
- Created automated concurrency unit test suite verifying that parallel booking attempts for the same trainer slot resolve with exactly one winner and zero double bookings.

## NEXT STEP
Phase 5: Payments & Package Subscriptions (Razorpay test order generation, webhook/signature verification, package balance ledger).

## Decisions
- Booking slots occupy four 15-minute discrete atoms (60 mins total). Double booking prevention relies on database unique indexes inside MongoDB transactions rather than application-level checks.
- All pricing is stored in integer paise. Idempotency keys prevent double deduction on retry.

## Demo accounts (Password: Demo@12345)
customer@demo.test, trainer1@demo.test, admin@demo.test