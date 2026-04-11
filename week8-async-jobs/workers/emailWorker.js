const { emailQueue } = require("../config/queue");
const { sendMail } = require("../config/mailer");

/**
 * EMAIL WORKER
 * ============
 * This file registers a processor function for the "email" Bull queue.
 *
 * Bull calls this function automatically whenever a new job lands in
 * the queue. It runs in the same Node process as the server but is
 * fully decoupled — the route handler that added the job has already
 * returned a response to the client.
 *
 * Job payload shapes this worker handles:
 *   - type: "welcome"  → { to, name }
 *   - type: "task_complete" → { to, name, taskTitle, result }
 */

// ─── Welcome email template ────────────────────────────────────────────────

const welcomeTemplate = ({ name }) => ({
  subject: `Welcome to Week8 App, ${name}!`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Welcome aboard, ${name}! 🎉</h1>
      <p>Your account has been created successfully.</p>
      <p>You can now log in and start submitting background tasks.</p>
      <hr />
      <p style="color: #6b7280; font-size: 0.875rem;">
        This email was sent by Week8 App · Built with Nodemailer + Ethereal
      </p>
    </div>
  `,
  text: `Welcome, ${name}! Your account has been created successfully.`,
});

// ─── Task complete email template ──────────────────────────────────────────

const taskCompleteTemplate = ({ name, taskTitle, result }) => ({
  subject: `Your task "${taskTitle}" is done`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Task Completed ✓</h2>
      <p>Hi ${name},</p>
      <p>Your background task <strong>${taskTitle}</strong> has finished.</p>
      <p><strong>Result:</strong> ${result}</p>
      <hr />
      <p style="color: #6b7280; font-size: 0.875rem;">Week8 App</p>
    </div>
  `,
  text: `Hi ${name}, your task "${taskTitle}" is complete. Result: ${result}`,
});

// ─── Worker processor ──────────────────────────────────────────────────────

/**
 * emailQueue.process() registers a function that Bull calls for every job.
 *
 * The `job` object gives us:
 *   job.data      — the payload passed to emailQueue.add(payload)
 *   job.id        — unique job ID assigned by Bull
 *   job.progress() — report 0-100 progress (visible in Bull dashboards)
 *   job.log()     — append a log line to the job's log history
 */
emailQueue.process(async (job) => {
  const { type, to, name } = job.data;

  console.log(
    `[emailWorker] Processing job #${job.id} | type: ${type} | to: ${to}`,
  );
  await job.progress(10);

  let template;

  if (type === "welcome") {
    template = welcomeTemplate({ name });
  } else if (type === "task_complete") {
    const { taskTitle, result } = job.data;
    template = taskCompleteTemplate({ name, taskTitle, result });
  } else {
    throw new Error(`Unknown email type: "${type}"`);
  }

  await job.progress(50);

  const { previewUrl } = await sendMail({ to, ...template });

  await job.progress(100);
  await job.log(`Email sent. Preview: ${previewUrl}`);

  // The return value is stored as job.returnvalue in Bull
  return { previewUrl };
});

// ─── Queue event hooks ─────────────────────────────────────────────────────

emailQueue.on("completed", (job, result) => {
  console.log(
    `[emailWorker] ✓ Job #${job.id} completed | preview: ${result.previewUrl}`,
  );
});

emailQueue.on("failed", (job, err) => {
  console.error(
    `[emailWorker] ✗ Job #${job.id} failed | reason: ${err.message}`,
  );
});

console.log("✓ emailWorker ready — listening on 'email' queue");
