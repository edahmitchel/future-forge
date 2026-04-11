const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { emailQueue } = require("../config/queue");
const AppError = require("../utils/appError");

const router = express.Router();

// ─── POST /auth/register ─────────────────────────────────────────────────
// Creates a new user, then immediately returns 201 to the client.
// The welcome email is added to the Bull queue — it will be sent
// asynchronously by emailWorker.js without blocking this response.

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("name, email, and password are required", 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("Email already registered", 409));
    }

    const user = await User.create({ name, email, password });

    // ── Queue the welcome email (non-blocking) ────────────────────────
    // We call emailQueue.add() but do NOT await a sent confirmation.
    // The route returns immediately; the emailWorker handles delivery.
    const job = await emailQueue.add({
      type: "welcome",
      to: user.email,
      name: user.name,
    });

    console.log(
      `[auth] Welcome email queued | jobId: ${job.id} | to: ${user.email}`,
    );

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.status(201).json({
      success: true,
      message: "Registration successful. A welcome email is on its way!",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /auth/login ────────────────────────────────────────────────────

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
