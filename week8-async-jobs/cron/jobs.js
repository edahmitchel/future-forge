const cron = require("node-cron");
const Task = require("../models/Task");

/**
 * CRON JOBS
 * =========
 * node-cron uses standard cron syntax:
 *
 *   ┌──────── second (optional)
 *   │ ┌────── minute
 *   │ │ ┌──── hour
 *   │ │ │ ┌── day of month
 *   │ │ │ │ ┌ month
 *   │ │ │ │ │ ┌ day of week (0=Sun)
 *   * * * * * *
 *
 */
const registerCronJobs = () => {
  // ── Job 1: Pending task monitor (every minute) ──────────────────────────
  // Runs every minute and logs how many tasks are still waiting.

  cron.schedule("* * * * *", async () => {
    try {
      const pendingCount = await Task.countDocuments({ status: "pending" });
      const processingCount = await Task.countDocuments({
        status: "processing",
      });
      console.log(
        `[cron] Task monitor — pending: ${pendingCount} | processing: ${processingCount}`,
      );
    } catch (err) {
      console.error("[cron] Task monitor error:", err.message);
    }
  });

  console.log("  → Task monitor scheduled (every minute)");

  // ── Job 2: Stuck task cleanup (every 5 minutes) [DBM]─────────────────────────
  // In production, a worker crash or Redis reconnect can leave tasks
  // stuck in the "processing" state indefinitely. This job finds any
  // tasks that have been "processing" for more than 2 minutes and
  // resets them to "pending" so the queue can retry them.

  cron.schedule("*/5 * * * *", async () => {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const { modifiedCount } = await Task.updateMany(
        {
          status: "processing",
          startedAt: { $lt: twoMinutesAgo },
        },
        {
          status: "pending",
          startedAt: null,
          jobId: null,
        },
      );

      if (modifiedCount > 0) {
        console.log(
          `[cron] Cleanup — reset ${modifiedCount} stuck task(s) to "pending"`,
        );
      } else {
        console.log("[cron] Cleanup — no stuck tasks found");
      }
    } catch (err) {
      console.error("[cron] Cleanup error:", err.message);
    }
  });

  console.log("  → Stuck task cleanup scheduled (every 5 minutes)");

  console.log("✓ Cron jobs registered");
};

module.exports = registerCronJobs;
