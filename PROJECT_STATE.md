# PROJECT STATE
Last updated: 19 Oct 2026   Last AI used: Claude
CURRENT PHASE: 11 (security and correctness repairs) delivered. Next: Phase 12.

## Phase checklist
- [x] 0 to 10 Original build (with gaps listed in docs/plan/ZURYO_GAP_AUDIT_AND_FIX_PHASES.md)
- [x] 11 Security and correctness repairs
- [ ] 12 Availability, slot grid, preferred trainer, instant auto-select
- [ ] 13 Checkout holds, package booking, idempotency, real concurrency tests
- [ ] 14 Cancel, reschedule, refund, notifications, booking lists
- [ ] 15 Session lifecycle, background ticker, synced timers, buzzer
- [ ] 16 Records form, feedback, history, AI (NVIDIA then Gemini then rules)
- [ ] 17 Admin console, editable pricing and peak windows
- [ ] 18 Tests, docs pack, deploy, video, submission
- [ ] 19 (optional) Closed-tab push

## ACHIEVEMENTS IN PHASE 11
- Removed payment signature bypass; HMAC compared in constant time; verify is idempotent.
- Removed public package purchase; packages created only after a verified payment (unique paymentId).
- Orders bound to the logged-in customer; amount from server-side snapshot or template price.
- Ownership checks on booking, ticker and session records; feedback only on own COMPLETED booking.
- Atomic, status-guarded session start and complete.
- JWT_SECRET minimum 32 restored; env centralised (Razorpay, Gemini, NVIDIA vars).
- Notification times in India time (formatIst). Pricing: insert-only seed, default peak windows fixed, pure buildQuote with real tests.
- 26 passing unit tests. Fake concurrency test deleted.
- Docs started: README.md, docs/ARCHITECTURE.md (sections 1, 6, 8).

## Decisions (locked)
- Cancellation: customer 2 h or more before start gets full refund or package credit; less than 2 h none; trainer cancel always full; unpaid hold just released.
- Reschedule: 2 h or more before start, max 2, keeps original price.
- Package booking pays 0; earliest-expiry credit used first.
- Instant: next 15-minute mark at least 10 min ahead; options within 60 min; earliest with a free trainer is auto-selected.
- Peak (IST, by start time): Mon-Fri 06-09 and 17-21; Sat-Sun 07-11. Normal 39900, peak 49900 paise, commission 10%.
- Unpaid hold 10 minutes. AI order NVIDIA, Gemini, rules. No new npm packages in phases 11-18.

## Known gaps still open
- Booking is CONFIRMED before payment (Phase 13). No slot grid or preferred-trainer UI (Phase 12).
- Package booking not wired, no refunds, no reschedule UI (Phases 13, 14).
- No background 55/60-minute events, no buzzer sound (Phase 15).
- No trainer record form, no feedback UI, no history page (Phase 16).
- Admin cannot edit peak windows; admin tables show IDs (Phase 17).
- Deployment, video, full docs pack (Phase 18).

## CODE GOTCHAS (read before writing code)
- Folders are Backend/ and Frontend/ (capital letters). On Render the root directory must be exactly Backend.
- Backend is ESM (NodeNext): relative imports end in .js even though files are .ts.
- Express 5: req.params values may be string or string[]; use requireObjectId() from utils/ids.ts.
- Mongoose 9: use { returnDocument: 'after' } (not new: true); use Types.ObjectId in interfaces; never put TypeScript syntax inside a schema object.
- Never call toLocaleString() on the server; use formatIst() from utils/timeFormat.ts.
- Money is integer paise everywhere. Times are UTC in the database, India time (Asia/Kolkata) for rules and display.
- Payments: no simulated signatures. Packages are created only in verifyPayment after the signature check.
- Frontend: import type is required for types; no enums; alias @ means src; Button variants are primary, secondary, ghost only; Input requires a label prop; the installed lucide-react has no ReceiptPercent (use ReceiptCent as ReceiptPercent).
- Tests: Vitest with Backend/vitest.config.ts supplying dummy env. Current tests need no database. Phase 13 adds Atlas test-database tests (MONGODB_URI_TEST).
- Docs live in README.md and docs/. Plan files live in docs/plan/. Update the matching doc section with every phase.

## Demo accounts (Password: Demo@12345)
customer@demo.test, customer2@demo.test, trainer1@demo.test to trainer5@demo.test, admin@demo.test