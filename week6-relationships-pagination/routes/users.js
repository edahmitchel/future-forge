const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const APIFeatures = require("../utils/apiFeatures");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// user -> account: one-to-one relationship
// user -> posts: one-to-many relationship
// post -> author: many-to-one relationship
// many-to-many relationships author -> likedPosts (not implemented here but common in real apps)

// GET /api/users/:id/posts
// Returns all posts authored by a specific user with pagination & sorting.
// Demonstrates a "has-many" relationship query.
router.get("/:id/posts", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: `No user found with id: ${req.params.id}`,
      });
    }

    // Pre-filter by author so APIFeatures works on top of it
    const baseQuery = Post.find({ author: req.params.id }).populate(
      "author",
      "name email",
    );

    const totalDocs = await Post.countDocuments({ author: req.params.id });

    const features = new APIFeatures(baseQuery, req.query)
      .sort()
      .limitFields()
      .paginate();

    const posts = await features.query;
    const { page, limit } = features.paginationMeta;

    res.json({
      success: true,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1,
      },
      results: posts.length,
      data: { user: { name: user.name, email: user.email }, posts },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user posts",
      message: error.message,
    });
  }
});

// GET /api/users/me (protected)
// Returns the logged-in user's profile and their post count
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "Your account may have been deleted",
      });
    }

    const postCount = await Post.countDocuments({ author: req.user.userId });

    res.json({
      success: true,
      data: { user, postCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve profile",
      message: error.message,
    });
  }
});

module.exports = router;
