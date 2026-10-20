# PROJECT STATE
Last updated: 20 Oct 2026   Last AI used: Gemini
CURRENT PHASE: 12 (availability, slot grid, preferred trainer, instant auto-select) delivered. Next: Phase 13.

## Phase checklist
- [x] 0 to 10 Original build (with gaps listed in docs/plan/ZURYO_GAP_AUDIT_AND_FIX_PHASES.md)
- [x] 11 Security and correctness repairs
- [x] 12 Availability, slot grid, preferred trainer, instant auto-select
- [ ] 13 Checkout holds, package booking, idempotency, real concurrency tests
- [ ] 14 Cancel, reschedule, refund, notifications, booking lists
- [ ] 15 Session lifecycle, background ticker, synced timers, buzzer
- [ ] 16 Records form, feedback, history, AI (NVIDIA then Gemini then rules)
- [ ] 17 Admin console, editable pricing and peak windows
- [ ] 18 Tests, docs pack, deploy, video, submission
- [ ] 19 (optional) Closed-tab push

## ACHIEVEMENTS IN PHASE 12
- Created `slots.service.ts` generating real available 60-minute session slots in 15-minute atoms for any date in IST.
- Created `availability.controller.ts` and `availability.routes.ts` with `GET /availability`, `GET /availability/instant`, and `GET /availability/trainers`.
- Refactored `assignment.service.ts` into a pure, deterministic `rankCandidates()` ranking by distance, load balancing, rating, and trainer ID tie-breaks, with full-session time-off overlap checks.
- Enforced booking rules: min 10-min lead time, 30-day max horizon, instant 60-min window, customer self-overlap protection.
- Updated `seed.ts` with an all-day 24/7 trainer (`trainer5@demo.test`) so instant booking demos work at any hour.
- Created `availability.test.ts` with 4 passing unit tests covering distance ranking, load balancing, preferred trainer preference, and ineligibility fallbacks.
- Built frontend stepper booking UI in `BookPage.tsx` with `ModeSwitch`, `SlotGrid`, `TrainerPicker`, and `time.ts` IST date helpers.

## Decisions (locked)
- Cancellation: customer 2 h or more before start gets full refund or package credit; less than 2 h none; trainer cancel always full; unpaid hold just released.
- Reschedule: 2 h or more before start, max 2, keeps original price.
- Package booking pays 0; earliest-expiry credit used first.
- Instant: next 15-minute mark at least 10 min ahead; options within 60 min; earliest with a free trainer is auto-selected.
- Peak (IST, by start time): Mon-Fri 06-09 and 17-21; Sat-Sun 07-11. Normal 39900, peak 49900 paise, commission 10%.
- Unpaid hold 10 minutes. AI order NVIDIA, Gemini, rules. No new npm packages in phases 11-18.

## CODE GOTCHAS
- Folders are Backend/ and Frontend/ (capital letters).
- Backend is ESM (NodeNext): relative imports end in .js.
- Mongoose 9: use `{ returnDocument: 'after' }`; use `Types.ObjectId` in interfaces.
- Dates and times: stored in UTC, evaluated and displayed in India time (Asia/Kolkata).
- Tests: Vitest with `Backend/vitest.config.ts`. Run `npm run test`.

## Demo accounts (Password: Demo@12345)
customer@demo.test, customer2@demo.test, trainer1@demo.test to trainer5@demo.test, admin@demo.test