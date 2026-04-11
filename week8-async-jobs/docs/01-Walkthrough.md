# Week 8 — Async Operations & Background Jobs

## Teaching Guide

---

## Table of Contents

1. [The Blocking Problem](#1-the-blocking-problem)
2. [async/await Recap](#2-asyncawait-recap)
3. [Bull Queues — Core Concepts](#3-bull-queues--core-concepts)
4. [Cron Jobs with node-cron](#4-cron-jobs-with-node-cron)
5. [Sending Email with Nodemailer + Ethereal](#5-sending-email-with-nodemailer--ethereal)
6. [App Architecture Walkthrough](#6-app-architecture-walkthrough)
7. [Running the App](#7-running-the-app)
8. [API Reference](#8-api-reference)
9. [Exercises](#9-exercises)

---

## 1. The Blocking Problem

When a user hits your API, Node processes their request on a **single thread**. If that handler takes 10 seconds — resizing an image, sending an email, generating a PDF — every other request waits in line behind it.

```
User A: POST /register          ← arrives
Worker: sending email...        ← blocks for 3 seconds
User B: GET /posts              ← waits... waits... waits
Worker: email done → respond
User B: finally gets a response
```

The fix is to **decouple** work from the request/response cycle:

1. The route handler saves the work to a **queue** and immediately responds.
2. A **worker** processes the queue in the background.
3. The client polls for the result, or receives a callback/notification when done.

```
User A: POST /register  →  queue.add(job)  →  201 (instant)
                                ↓
                         Worker picks up job asynchronously
                                ↓
                         Worker sends email → logs preview URL
```

---

## 2. async/await Recap

Every async operation in this app uses `async/await`. A quick refresher:

```js
// Without async/await — callback hell
User.findOne({ email }, (err, user) => {
  if (err) return next(err);
  bcrypt.compare(password, user.password, (err, match) => {
    // ...
  });
});

// With async/await — linear, readable
const user = await User.findOne({ email });
const match = await bcrypt.compare(password, user.password);
```

Rules:
- `await` can only be used inside an `async` function.
- `await` pauses *that function* but does **not** block Node's event loop.
- Wrap in `try/catch` to handle errors (or use `.catch()` on the returned Promise).

```js
// async route handler pattern used throughout this app
router.post("/register", async (req, res, next) => {
  try {
    const user = await User.create({ ... });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // passes to errorHandler middleware
  }
});
```

---

## 3. Bull Queues — Core Concepts

**Bull** is a Redis-backed job queue for Node. It gives you reliable, persistent task processing with retries, priority, scheduling, and monitoring.

### Mental Model

```
PRODUCER                 REDIS                   CONSUMER
(your route)             (the queue)             (your worker)

queue.add(payload)  ──►  [job][job][job]  ──►   queue.process(fn)
                                                      ↓
                                               fn(job) executes
```

### Key Components

| Term | What it is |
|---|---|
| **Queue** | A named channel backed by a Redis list. `new Bull("email", redisConfig)` |
| **Job** | A unit of work with a `data` payload and metadata (id, status, attempts) |
| **Producer** | Code that calls `queue.add(data)` — your route handlers |
| **Worker** | Code that calls `queue.process(fn)` — your worker files |
| **Redis** | The storage layer that persists jobs and coordinates between producer/worker |

### Creating a Queue

```js
const Bull = require("bull");

// Both the producer AND the worker use the same queue name + Redis config
const emailQueue = new Bull("email", {
  redis: { host: "127.0.0.1", port: 6379 },
});
```

### Adding a Job (Producer side — in a route handler)

```js
// Basic add
await emailQueue.add({ to: "alice@example.com", name: "Alice" });

// With options
await emailQueue.add(
  { to: "alice@example.com", name: "Alice" },
  {
    attempts: 3,         // retry up to 3 times on failure
    backoff: 5000,       // wait 5s between retries
    delay: 10000,        // don't start for 10 seconds
    priority: 1,         // lower number = higher priority
  }
);
```

### Processing Jobs (Worker side)

```js
// queue.process() is called once; Bull keeps calling fn for each new job
emailQueue.process(async (job) => {
  // job.data is whatever you passed to queue.add()
  const { to, name } = job.data;

  // Report progress (0–100) — visible in monitoring dashboards
  await job.progress(50);

  // Do the actual work
  await sendMail({ to, subject: "Welcome!", html: `<p>Hi ${name}</p>` });

  await job.progress(100);

  // Whatever you return is stored as job.returnvalue
  return { sent: true };
});
```

### Job States

```
waiting → active → completed
                ↘ failed  (will retry if attempts > 1)
delayed → waiting (job was added with a delay)
```

### Event Hooks

```js
emailQueue.on("completed", (job, result) => {
  console.log(`Job #${job.id} done`, result);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Job #${job.id} failed:`, err.message);
});

emailQueue.on("progress", (job, progress) => {
  console.log(`Job #${job.id}: ${progress}%`);
});
```

### Why Redis?

Redis stores the queue state. If your Node process crashes mid-job:
- The job is still in Redis.
- When the process restarts, Bull picks it up again.
- With `attempts: 3`, failures are retried automatically.

Without Redis (in-memory queue): crash = lost jobs.

> **Note on BullMQ**: This app uses Bull v4. The modern successor is **BullMQ** — same concepts, improved TypeScript support and worker concurrency model. For production apps, prefer BullMQ.

---

## 4. Cron Jobs with node-cron

Cron jobs run code on a **schedule**, independently of HTTP requests.

### Cron Syntax

```
 ┌──────── minute        (0–59)
 │  ┌───── hour          (0–23)
 │  │  ┌── day of month  (1–31)
 │  │  │  ┌─ month       (1–12)
 │  │  │  │  ┌ day of week (0–7, Sun=0 or 7)
 │  │  │  │  │
 *  *  *  *  *
```

Special characters:
- `*` — every unit ("any")
- `*/5` — every 5 units
- `0,30` — at 0 and 30
- `9-17` — from 9 to 17 (range)

### Common Patterns

| Expression | Meaning |
|---|---|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour on the hour |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 0 1 * *` | First day of every month |

### Using node-cron

```js
const cron = require("node-cron");

// Schedule a task
cron.schedule("* * * * *", async () => {
  console.log("Runs every minute");
  const count = await Task.countDocuments({ status: "pending" });
  console.log(`Pending tasks: ${count}`);
});
```

The **second** argument is called whenever the schedule fires. It can be async.

### Cron vs Queue — when to use each

| Use a **Queue** when... | Use a **Cron** when... |
|---|---|
| Work is triggered by a user action | Work runs on a fixed schedule |
| Load is unpredictable / bursty | Load is predictable, time-based |
| You need retries / priority | Simple recurrence is enough |
| E.g.: send email on registration | E.g.: send weekly digest, clean up old records |

This app uses **both**: the queue handles per-registration emails, the cron handles periodic maintenance.

---

## 5. Sending Email with Nodemailer + Ethereal

### Nodemailer

Nodemailer is the standard Node.js email library. You create a **transporter** (SMTP config) and call `transporter.sendMail(options)`.

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  auth: { user: "...", pass: "..." },
});

const info = await transporter.sendMail({
  from: '"My App" <no-reply@myapp.com>',
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello</h1>",
  text: "Hello",  // plain-text fallback
});
```

### Ethereal — Zero-Config Dev SMTP

In development, we don't want to send real emails. **Ethereal** is a fake SMTP service:

1. `nodemailer.createTestAccount()` hits the Ethereal API and returns a one-time SMTP credential.
2. You use those credentials as the transporter config.
3. Emails are captured — never delivered to real inboxes.
4. `nodemailer.getTestMessageUrl(info)` returns a browser link to preview the captured email.

```js
// Done once at startup (see config/mailer.js)
const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: { user: testAccount.user, pass: testAccount.pass },
});

// After sending:
const info = await transporter.sendMail({ ... });
console.log(nodemailer.getTestMessageUrl(info));
// → https://ethereal.email/message/Abc123...
```

Open that URL in a browser to see exactly what the email looked like — HTML rendering, headers, everything.

---

## 6. App Architecture Walkthrough

### Folder Structure

```
week8-async-jobs/
├── server.js               ← Entry point: boots DB, mailer, workers, cron, HTTP server
├── docker-compose.yml      ← Redis service
├── .env.example            ← Required environment variables
│
├── config/
│   ├── db.js               ← mongoose.connect()
│   ├── mailer.js           ← Nodemailer + Ethereal transporter
│   └── queue.js            ← Bull queue instances (emailQueue, taskQueue)
│
├── models/
│   ├── User.js             ← name, email, password (hashed), role
│   └── Task.js             ← title, description, status, result, userId
│
├── routes/
│   ├── auth.js             ← POST /auth/register, POST /auth/login
│   └── tasks.js            ← POST /tasks, GET /tasks, GET /tasks/:id
│
├── middleware/
│   ├── auth.js             ← verifyToken, requireRole (JWT)
│   └── errorHandler.js     ← Central 4-param error handler
│
├── workers/
│   ├── emailWorker.js      ← Consumes emailQueue → sends via Nodemailer
│   └── taskWorker.js       ← Consumes taskQueue → updates Task status in DB
│
├── cron/
│   └── jobs.js             ← node-cron schedules
│
└── utils/
    └── appError.js         ← AppError class (operational errors)
```

### Flow 1 — Registration & Welcome Email

```
Client                  Route Handler           Bull Queue          Worker
  │                          │                      │                  │
  │── POST /auth/register ──►│                      │                  │
  │                          │── User.create() ────►│                  │
  │                          │── emailQueue.add() ─►│ [job in Redis]   │
  │◄── 201 Created ─────────│                      │                  │
  │                          │                      │── process(job) ─►│
  │                          │                      │                  │── sendMail()
  │                          │                      │                  │── logs preview URL
  │                          │                      │◄── completed ───│
```

**Key teaching point**: The route handler returns **before** the email is sent. The client gets an instant response. The email happens "behind the scenes".

### Flow 2 — Background Task

```
Client                  Route Handler           Bull Queue          Worker          DB
  │                          │                      │                  │             │
  │── POST /tasks ──────────►│                      │                  │             │
  │                          │── Task.create() ────────────────────────────────────►│
  │                          │   status: "pending"  │                  │             │
  │                          │── taskQueue.add() ──►│ [job in Redis]   │             │
  │◄── 202 Accepted ────────│                      │                  │             │
  │                          │                      │                  │             │
  │── GET /tasks/:id ───────►│                      │                  │             │
  │◄── { status: "pending" }│                      │                  │             │
  │                          │                      │── process(job) ─►│             │
  │                          │                      │                  │─ update DB ►│
  │                          │                      │                  │  status: "processing"
  │── GET /tasks/:id ───────►│                      │                  │             │
  │◄── { status: "processing" }                     │                  │             │
  │                          │                      │                  │── (work...) │
  │                          │                      │                  │─ update DB ►│
  │                          │                      │                  │  status: "completed"
  │── GET /tasks/:id ───────►│                      │                  │             │
  │◄── { status: "completed", result: "..." }       │                  │             │
```

**HTTP 202 vs 201**: `201 Created` means the resource is ready. `202 Accepted` means "I have your request and I'm working on it." Use 202 for queued/async work.

### Flow 3 — Cron Jobs

```
Time: HH:MM:00  →  Task monitor fires  →  counts pending/processing tasks  →  logs to console
Time: HH:MM:00  →  Cleanup fires every 5th minute  →  finds stuck "processing" tasks  →  resets to "pending"
```

Cron jobs have no HTTP context — they run on a timer, isolated from any specific request.

---

## 7. Running the App

### Prerequisites

- Node.js
- Docker (for Redis)
- MongoDB running locally or Atlas URI

### Setup

```bash
# 1. Start Redis
docker-compose up -d

# 2. Copy env file
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET at minimum

# 3. Install dependencies
yarn install

# 4. Start the server
yarn dev
```

### Expected startup output

```
✓ MongoDB connected successfully
  Database: week8_async_jobs
✓ Mailer ready (Ethereal SMTP)
  Inbox preview: https://ethereal.email/messages
  Login: abc123@ethereal.email / somepassword
✓ emailWorker ready — listening on "email" queue
✓ taskWorker ready — listening on "task" queue
  → Task monitor scheduled (every minute)
  → Stuck task cleanup scheduled (every 5 minutes)
✓ Cron jobs registered
✓ Server running on http://localhost:3000
```

---

## 8. API Reference

### Auth

#### `POST /auth/register`

```json
// Request body
{ "name": "Alice", "email": "alice@example.com", "password": "password123" }

// Response 201
{
  "success": true,
  "message": "Registration successful. A welcome email is on its way!",
  "data": { "user": { ... }, "token": "eyJ..." }
}
```

Side effect: a welcome email job is added to the Bull queue. Watch the console for the Ethereal preview URL.

#### `POST /auth/login`

```json
// Request body
{ "email": "alice@example.com", "password": "password123" }

// Response 200
{ "success": true, "data": { "token": "eyJ..." } }
```

### Tasks

All task routes require `Authorization: Bearer <token>`.

#### `POST /tasks`

```json
// Request body
{ "title": "Generate report", "description": "Monthly sales summary" }

// Response 202 — task is accepted but not yet processed
{
  "success": true,
  "message": "Task accepted and queued for processing",
  "data": {
    "task": { "_id": "...", "status": "pending", ... },
    "jobId": "42",
    "statusUrl": "/tasks/<id>"
  }
}
```

#### `GET /tasks`

Returns all tasks belonging to the authenticated user, newest first.

#### `GET /tasks/:id`

Poll this endpoint to observe the status lifecycle: `pending` → `processing` → `completed`.

```json
// Response 200
{
  "success": true,
  "data": {
    "task": {
      "_id": "...",
      "title": "Generate report",
      "status": "completed",
      "result": "Processed \"Generate report\" successfully at 2026-04-10T...",
      "startedAt": "...",
      "finishedAt": "..."
    },
    "jobInfo": {
      "id": "42",
      "progress": 100,
      "state": "completed",
      "attemptsMade": 1
    }
  }
}
```
