const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Please provide name, email, and password",
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
        message: "Please use a different email or login",
      });
    }

    // Create new user
    // Password will be automatically hashed by User model's pre-save hook
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    // Generic error message for security (don't leak validation rules)
    console.log("herer");
    res.status(400).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing credentials",
        message: "Please provide email and password",
      });
    }

    // Find user by email
    // Note: .select('+password') is needed because password is excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    // Generic error message (security: don't expose if email exists)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Compare provided password with stored hash
    // Using bcryptjs.compare() which is timing-resistant
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Password is valid, generate JWT token
    // Payload includes userId, email, role (excludes password!)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION || "1h",
      },
    );

    // Return token and user info
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        expiresIn: process.env.JWT_EXPIRATION || "1h",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Please provide name, email, and password",
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
        message: "Please use a different email or login",
      });
    }

    // Create admin user
    // Password will be automatically hashed by User model's pre-save hook
    // Role is explicitly set to 'admin'
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: admin,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Admin creation failed",
      message: error.message,
    });
  }
});

module.exports = router;
