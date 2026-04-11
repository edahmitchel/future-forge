const mongoose = require("mongoose");

/**
 * Task represents a unit of background work submitted by a user.
 *
 * Status lifecycle:
 *   pending → processing → completed
 *                       ↘ failed
 *
 * The taskWorker picks up pending jobs from the Bull queue and
 * updates this document as it progresses.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Tracks where the job is in its lifecycle
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    // Populated by the worker when the job finishes
    result: {
      type: String,
      default: null,
    },
    // If the job fails, the error message is stored here
    error: {
      type: String,
      default: null,
    },
    // The Bull job ID — useful for progress tracking
    jobId: {
      type: String,
      default: null,
    },
    // Which user submitted this task
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // When the worker started processing (set by taskWorker)
    startedAt: {
      type: Date,
      default: null,
    },
    // When the worker finished (set by taskWorker)
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for efficiently finding tasks by status (used by cron cleanup job)
taskSchema.index({ status: 1, createdAt: -1 });
// Index for listing a user's own tasks
taskSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
