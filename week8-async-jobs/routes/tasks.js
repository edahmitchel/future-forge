const express = require("express");
const Task = require("../models/Task");
const { taskQueue } = require("../config/queue");
const { verifyToken } = require("../middleware/auth");
const AppError = require("../utils/appError");

const router = express.Router();

// All task routes require authentication
router.use(verifyToken);

// ─── POST /tasks ──────────────────────────────────────────────────────────
// Creates a Task document with status "pending", then immediately returns
// 202 Accepted. The heavy work is delegated to the taskWorker via Bull.
//
// Note the HTTP 202 status — it means "I've accepted your request and will
// process it, but the work isn't done yet". This is the correct status for
// async/queued operations (vs 201 Created which implies the resource is ready).

router.post("/", async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return next(new AppError("Task title is required", 400));
    }

    // Save the task to the DB immediately so the client has an ID to poll
    const task = await Task.create({
      title,
      description,
      userId: req.user.id,
    });

    // Add a job to the Bull queue — the taskWorker will pick this up
    const job = await taskQueue.add({ taskId: task._id.toString() });

    console.log(`[tasks] Job #${job.id} queued for task: ${task._id}`);

    // 202 Accepted — resource exists but processing is ongoing
    res.status(202).json({
      success: true,
      message: "Task accepted and queued for processing",
      data: {
        task,
        jobId: job.id,
        // Tell the client where to poll for status updates
        statusUrl: `/tasks/${task._id}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /tasks ──────────────────────────────────────────────────────────
// List all tasks belonging to the authenticated user.

router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      results: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /tasks/:id ──────────────────────────────────────────────────────
// Fetch a single task by ID — used to poll for status changes.
// Students call this repeatedly (or use it in a loop) to observe the
// pending → processing → completed lifecycle in real time.

router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id, // users can only see their own tasks
    });

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    // Optionally enrich with live Bull job data
    let jobInfo = null;
    if (task.jobId) {
      const job = await taskQueue.getJob(task.jobId);
      if (job) {
        jobInfo = {
          id: job.id,
          progress: await job.progress(),
          state: await job.getState(),
          attemptsMade: job.attemptsMade,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: { task, jobInfo },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
