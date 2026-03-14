const express = require("express");
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();
router.get("/profile", verifyToken, async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    // Contains: { userId, email, role, iat, exp }

    // Find user in database
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User account was deleted",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Profile retrieval failed",
      message: error.message,
    });
  }
});

router.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Don't include password hashes

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
