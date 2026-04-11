const { taskQueue, emailQueue } = require("../config/queue");
const Task = require("../models/Task");
const User = require("../models/User");

/**
 * TASK WORKER
 * ===========
 * Processes jobs from the "task" Bull queue.
 *
 * Each job carries { taskId } — the MongoDB _id of a Task document.
 * The worker:
 *   1. Marks the Task as "processing" in the DB
 *   2. Simulates real async work (e.g., image resize, report generation)
 *   3. Marks the Task as "completed" with a result
 *   4. Optionally queues a follow-up email notification
 *
 * If anything throws, Bull catches it and marks the job "failed".
 * The worker also updates the Task document to reflect that failure.
 */

// Simulate a long-running async operation (e.g., heavy computation, external API)
const simulateWork = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

// ─── Worker processor ──────────────────────────────────────────────────────

taskQueue.process(async (job) => {
  const { taskId } = job.data;

  console.log(`[taskWorker] Processing job #${job.id} | taskId: ${taskId}`);

  // ── Step 1: Mark task as "processing" ─────────────────────────────────
  const task = await Task.findByIdAndUpdate(
    taskId,
    { status: "processing", startedAt: new Date(), jobId: String(job.id) },
    { new: true },
  );

  if (!task) {
    throw new Error(`Task ${taskId} not found in database`);
  }

  await job.progress(20);
  await job.log(`Task "${task.title}" marked as processing`);

  // ── Step 2: Simulate work (replace with real logic in production) ──────
  // In a real app this might be: resizing an image, generating a PDF,
  // calling a slow third-party API, running a data export, etc.
  const workDuration = 3000 + Math.random() * 2000; // 3–5 seconds
  console.log(
    `[taskWorker] Working on "${task.title}" (~${Math.round(workDuration / 1000)}s)...`,
  );

  await simulateWork(workDuration * 0.5);
  await job.progress(60);

  await simulateWork(workDuration * 0.5);
  await job.progress(90);

  // ── Step 3: Mark task as "completed" ─────────────────────────────────
  const result = `Processed "${task.title}" successfully at ${new Date().toISOString()}`;

  await Task.findByIdAndUpdate(taskId, {
    status: "completed",
    result,
    finishedAt: new Date(),
  });

  await job.progress(100);
  await job.log(`Task completed. Result: ${result}`);

  // ── Step 4: Queue a completion email to the task owner ────────────────
  const user = await User.findById(task.userId).select("name email");
  if (user) {
    await emailQueue.add({
      type: "task_complete",
      to: user.email,
      name: user.name,
      taskTitle: task.title,
      result,
    });
    console.log(`[taskWorker] Queued completion email to ${user.email}`);
  }

  return { taskId, result };
});

// ─── Queue event hooks ─────────────────────────────────────────────────────

taskQueue.on("completed", (job) => {
  console.log(`[taskWorker] ✓ Job #${job.id} completed`);
});

taskQueue.on("failed", async (job, err) => {
  console.error(
    `[taskWorker] ✗ Job #${job.id} failed | reason: ${err.message}`,
  );

  // Update the Task document so the client can see the failure
  try {
    await Task.findByIdAndUpdate(job.data.taskId, {
      status: "failed",
      error: err.message,
      finishedAt: new Date(),
    });
  } catch (dbErr) {
    console.error(
      "[taskWorker] Could not update task status to failed:",
      dbErr.message,
    );
  }
});

taskQueue.on("progress", (job, progress) => {
  console.log(`[taskWorker] Job #${job.id} progress: ${progress}%`);
});

console.log("✓ taskWorker ready — listening on 'task' queue");
