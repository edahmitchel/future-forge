const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const userCount = await User.countDocuments({ role: "user" });

    // Get count of users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const registeredToday = await User.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        admins: adminCount,
        regularUsers: userCount,
        registeredToday,
        requestedBy: req.user.email, // Show who made the request
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve stats",
      message: error.message,
    });
  }
});
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("+createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve users",
      message: error.message,
    });
  }
});
module.exports = router;
