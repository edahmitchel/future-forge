require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { initMailer } = require("./config/mailer");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/appError");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

// ─── Workers & Cron ──────────────────────────────────────────────────────
// Importing these files registers the Bull processors and cron schedules.
// The workers listen on their respective queues from the moment these
// lines execute — no explicit "start" call needed.
require("./workers/emailWorker");
require("./workers/taskWorker");

const registerCronJobs = require("./cron/jobs");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
  });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// 404 handler — catches any route that didn't match above
app.all("*splat", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Central error handler — must be the last middleware (4 params)
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  await initMailer();

  registerCronJobs();

  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`\n  Routes:`);
    console.log(`    POST   /auth/register`);
    console.log(`    POST   /auth/login`);
    console.log(`    POST   /tasks         (auth required)`);
    console.log(`    GET    /tasks         (auth required)`);
    console.log(`    GET    /tasks/:id     (auth required)`);
    console.log(`    GET    /health\n`);
  });
};

start();
