const Bull = require("bull");

// Redis connection options — values from .env (set by docker-compose)
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
};

/**
 * emailQueue  — jobs that send transactional emails via Nodemailer.
 *
 * Each job payload shape:
 * { to: string, name: string, subject: string, html: string }
 */
const emailQueue = new Bull("email", redisConfig);

/**
 * taskQueue — jobs that represent user-submitted background tasks.
 *
 * Each job payload shape:
 * { taskId: string }   (MongoDB ObjectId of the Task document)
 */
const taskQueue = new Bull("task", redisConfig);

// Log queue-level errors (e.g., Redis disconnects) — these don't crash the process
emailQueue.on("error", (err) =>
  console.error("emailQueue error:", err.message),
);
taskQueue.on("error", (err) => console.error("taskQueue error:", err.message));

module.exports = { emailQueue, taskQueue };
