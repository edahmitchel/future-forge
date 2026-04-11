
## 9. Exercises

### Exercise 1 — Force a failure and observe retry (This uses the Taks routes)

- In `workers/taskWorker.js`, add a random failure:

- Then update `taskQueue.add()` in `routes/tasks.js` to retry:


Save your files, then `POST` a Task. Watch the console. Notice:
- The `failed` event fires with the error.
- Bull waits 2 seconds, then retries.
- The Task document's status changes back via the cleanup cron (or immediately if you update `failed` handler to re-enqueue).

---

### Exercise 2 — Add a task completion email

**Goal**: When a task completes, send the user an email notification.

The skeleton is already in `taskWorker.js` — look for the `emailQueue.add({ type: "task_complete", ... })` call. It's already implemented.

Your task: register and submit a task, then check the console for a **second** Ethereal preview URL — this should be the task completion email.

---

### Exercise 3 — New cron job: Daily summary

Add a third cron job to `cron/jobs.js` that runs every day at 8:00 AM:

```js
cron.schedule("FIGURE OUT THE CRON SYNTAX", async () => {
  const completed = await Task.countDocuments({ status: "completed" });
  const failed = await Task.countDocuments({ status: "failed" });
  console.log(`[cron] Daily summary — completed: ${completed} | failed: ${failed}`);
});
```

To test it without waiting until 8 AM, temporarily change the schedule to `"* * * * *"` (every minute), verify it works, then change it back.

---

### Exercise 4 — Admin queue stats endpoint

Add a protected admin-only route `GET /admin/queue-stats` that returns live Bull queue metrics:

Mote: `queue.getJobCounts()` returns `{ waiting, active, completed, failed, delayed }` — useful for monitoring dashboards.

---

### Bonus — BullMQ

Bull v4 (used here) and BullMQ are conceptually identical but BullMQ has:
- Better TypeScript support
- Improved concurrency with `Worker` class
- Flow producers (job dependencies)
- Rate limiters

Research: how would you convert `emailWorker.js` to use BullMQ's `Worker` class instead of `bull.process()`?
