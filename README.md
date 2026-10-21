# Zuryo Fitness - On-Demand Residential Fitness Booking Platform

A full-stack, production-ready on-demand fitness booking platform designed for residential communities. Zuryo connects customers with certified fitness trainers for instant or scheduled 60-minute doorstep workout sessions, featuring automated trainer proximity assignment, server-authoritative timers, idempotent package management, dynamic pricing, and multi-provider AI workout generation.

---

## 🚀 Live Demo & Repository Links

* **Live Application URL:** [https://zuryo-fitness.netlify.app](https://zuryo-fitness.netlify.app)
* **GitHub Repository:** [https://github.com/Manish-Yadav77/Zuryo_Fitness_App](https://github.com/Manish-Yadav77/Zuryo_Fitness_App)
* **Video Walkthrough:** [https://loom.com/share/your-demo-video-link](https://loom.com/share/your-demo-video-link)

---

## 🔑 Demo Access Credentials

The database comes pre-seeded with realistic synthetic data across all user roles. You can log in using these credentials or click the quick-fill buttons on the login screen:

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@demo.test` | `password123` | Fitness profile, package credits, AI workout generator, instant/scheduled booking. |
| **Trainer** | `trainer1@demo.test` | `password123` | Assigned doorstep workouts, 60m live timer, availability manager, workout logger. |
| **Admin** | `admin@demo.test` | `password123` | Platform revenue metrics, system bookings table, assignment logs, dynamic pricing config. |

---

## 🛠 Tech Stack & Architecture Choices

* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6, Vite.
* **Backend:** Node.js, Express.js, TypeScript, Mongoose, JWT Authentication, Zod validation.
* **Database:** MongoDB Atlas (Geospatial indexing, transactional session locks).
* **AI Engine:** Multi-provider architecture with NVIDIA NIM microservices (`meta/llama-3.2-90b-vision-instruct`), Google Gemini API (`gemini-2.5-flash`), and a deterministic rules safety fallback.
* **Testing:** Vitest (Unit & integration test suite).
* **Hosting:** Netlify (Frontend) & Render (Backend REST API).

---

## 📋 Comprehensive Feature Matrix

### 1. Customer Experience
* **Fitness Profile & Assessment:** Tracks age, weight, goals, fitness level, preferences, and physical limitations.
* **Booking Modes:** Supports Instant Booking (starting within 60 minutes) and Scheduled Booking (future time slots).
* **Trainer Selection:** Choice between manual preferred trainer selection or automated proximity-based auto-assignment.
* **Idempotent Package Management:** Pre-purchased session package balance tracking with ledger locking to prevent duplicate session deductions during retries.
* **Booking History & Reviews:** Full session history displaying active, completed, or cancelled bookings alongside customer star ratings and written reviews.

### 2. Trainer Operations
* **Schedule & Time-Off Management:** Configure recurring weekly working hours and block specific time-off calendar dates.
* **Assigned Sessions View:** Real-time feed of assigned doorstep workouts with customer flat numbers and society addresses.
* **Authoritative 60-Minute Session Timer:** Server-driven workout timer with a 55-minute warning buzzer and 60-minute completion trigger. Survives browser refreshes and device clock discrepancies.
* **Workout Logger:** Log completed exercises (sets, reps, weights), duration, trainer notes, customer feedback, and suggested next workouts.

### 3. Admin & Operations Console
* **Platform Metrics:** Live dashboard tracking total platform bookings, gross revenue volume, and active sessions.
* **System Booking Oversight:** Tabular view inspecting customer sessions across all statuses.
* **Auto-Assignment Evaluation Logs:** Step-by-step inspection log showing candidate trainers evaluated during booking creation, distance in kilometers, star ratings, daily session loads, eligibility status, and chosen candidate highlights.
* **Dynamic Pricing Configurator:** Edit base rates (Normal ₹399, Peak ₹499), society commission percentage (10%), and active peak time windows dynamically.

---

## 🧠 AI Recommendation Engine Architecture

Zuryo features a multi-provider fallback AI architecture to guarantee 99.99% availability for generating 60-minute workout recommendations based on customer profiles and past workout logs.

[Customer Profile & Session History]
│
▼
┌───────────────────────┐
│  Primary AI Provider  │ ──(Success)──► [Formatted Plan]
│   NVIDIA NIM Micro    │
└───────────────────────┘
│ (Fail / Timeout)
▼
┌───────────────────────┐
│  Fallback 1 Provider  │ ──(Success)──► [Formatted Plan]
│   Google Gemini API   │
└───────────────────────┘
│ (Fail / Timeout)
▼
┌───────────────────────┐
│  Fallback 2 Provider  │ ──────────────► [Formatted Plan]
│  Rules Safety Engine  │
└───────────────────────┘


* **Execution Metadata:** Every generated recommendation records source provenance (`NVIDIA`, `GEMINI`, or `RULES`), exact model name, and execution latency in milliseconds.
* **Estimated Cost per 1,000 Recommendations:**
  * NVIDIA NIM: ~$0.0015 per call.
  * Google Gemini 2.5 Flash: ~$0.0001 per call.
  * Rules Engine: $0.00.

---

## 🔒 Engineering Decisions & Technical Solutions

### 1. Trainer Auto-Assignment & Proximity Scoring
When a booking is created without a selected preferred trainer, the assignment engine evaluates candidate trainers through a multi-pass filter:
1. **Zone & Availability Filter:** Filters active trainers covering the society's service zone and working within the requested time slot.
2. **Time-Off & Overlap Check:** Excludes trainers with existing overlapping bookings or active time-off blocks.
3. **Scoring Formula:** Candidates are ranked using a weighted proximity and load score:
   $$\text{Score} = (\text{Distance in km} \times 0.5) + (\text{Sessions Today} \times 1.5) - (\text{Rating} \times 0.2)$$
   The eligible candidate with the lowest overall score is assigned automatically.

### 2. Double-Booking & Concurrency Prevention
To handle simultaneous booking requests for the same trainer slot, Zuryo utilizes atomic MongoDB `SlotLock` documents with a unique composite index (`trainerId` + `atomStart`). Atomic upsert attempts hold temporary 10-minute locks during checkout before final payment confirmation.

### 3. Server-Authoritative Session Timer
To prevent client-side timer manipulation or page refresh resets, session start timestamps are stored on the database server. When requested, the server computes remaining duration:
$$\text{Remaining Seconds} = \max\left(0, 3600 - \left\lfloor\frac{\text{Current Time} - \text{Started At}}{1000}\right\rfloor\right)$$
The frontend polls the server every 5 seconds while maintaining a smooth local 1-second countdown tick.

### 4. Client-Side Price Tampering Prevention
All final payable amounts, commission cuts, and package deductions are computed and enforced on the server inside `pricing.service.ts`. The client only passes slot time parameters; price totals sent in client request bodies are strictly ignored.

---

## 🗄 Database Schema & Key Models

┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     User     │───◄ │ CustomerProfile  │───► │     Society      │
└──────────────┘     └──────────────────┘     └──────────────────┘
│                                               ▲
│             ┌──────────────────┐              │
└───────────◄ │  TrainerProfile  │              │
└──────────────────┘              │
│                       │
▼                       │
┌──────────────────┐              │
│     Booking      │──────────────┘
└──────────────────┘
│
┌──────────────────┼──────────────────┐
▼                  ▼                  ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│  SessionRecord   │ │   SlotLock    │ │AssignmentDecision│
└──────────────────┘ └───────────────┘ └──────────────────┘


---

## 🧪 Automated Testing Guide

Run the automated test suite using Vitest to verify core business logic:


# Navigate to backend directory
cd Backend

# Run unit and integration tests
npm test
Test Coverage Highlights:
pricing.test.ts: Verifies normal slot (₹399 + 10%), peak slot (₹499 + 10%), and custom commission pricing formulas.

assignment.test.ts: Validates trainer proximity filtering, daily session load balance, and fallback handling.

concurrency.test.ts: Ensures atomic slot locks reject simultaneous overlapping booking attempts.

ownership.test.ts: Verifies role-based access control and route authorization middleware.

📐 Design Proposals for Future Features
1. Live Trainer GPS Tracking & Real-Time ETA
Architecture: Mobile app sends background location coordinates every 10 seconds over WebSockets (Socket.io) or MQTT to a Redis geospatial cache (GEOADD).

ETA Engine: Integrates Google Distance Matrix API with real-time traffic offsets.

APIs & Schema: POST /api/v1/trainer/location and WebSocket event trainer:location:updated.

2. Push Notifications & Session Reminders
Architecture: Node.js worker consuming delayed job queues (BullMQ + Redis) triggering Apple APNs and Firebase Cloud Messaging (FCM).

Triggers: Sent 30 minutes before slot start, upon trainer arrival, and at the 55-minute session mark.

💰 Operating Cost Estimates & Scaling Architecture
Monthly Cloud Infrastructure Cost (10,000 Bookings/Month)
Component	Technology	Estimated Monthly Cost
Application Hosting	Render / AWS ECS (2 Containers)	$14.00
Database	MongoDB Atlas (M10 Cluster)	$59.00
In-Memory Cache	Redis Cloud (Session locks & slot cache)	$10.00
AI Workouts	NVIDIA NIM & Gemini APIs (~10,000 runs)	$1.50
Total Estimated Cost		~$84.50 / month
Scaling Strategy to 100,000+ Bookings/Month:
Read Replicas: Route trainer availability queries to MongoDB read secondary nodes.

Redis Slot Caching: Cache availability matrices in Redis bitfields to eliminate DB reads during slot discovery.

Queue-Based Assignment: Process instant booking requests asynchronously through SQS/RabbitMQ queues to prevent connection spikes.

⚙️ Local Development Setup Instructions
1. Prerequisites
Node.js v18 or higher

MongoDB instance (Local or MongoDB Atlas)

2. Backend Setup

cd Backend
npm install
cp .env.example .env
# Configure MONGO_URI and JWT_SECRET inside .env

# Wipe and seed synthetic database
npm run seed

# Start development server
npm run dev
3. Frontend Setup
Bash
cd Frontend
npm install
cp .env.example .env

# Start frontend application
npm run dev
🛣 Roadmap: What I Would Build Next
Native Mobile App (React Native): Adapt existing React web components to React Native using shared TypeScript API hooks for iOS and Android background GPS support.

In-App Messaging & Audio Notes: Direct encrypted communication channel between assigned trainer and customer prior to session arrival.

Automated Trainer Payouts: Integrate Stripe Connect or Razorpay Route for automatic split settlements after session completion.