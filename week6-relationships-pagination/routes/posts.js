const express = require("express");
const Post = require("../models/Post");
const APIFeatures = require("../utils/apiFeatures");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// -----------------------------------------------------------------------
// GET /api/posts
// Supports: ?page=1&limit=10&sort=-createdAt&fields=title,author
//           ?published=true&tags=node&views[gte]=5&search=express
// -----------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Count total matching documents (before pagination) for meta
    const filterQuery = { ...req.query };
    ["page", "sort", "limit", "fields", "search"].forEach(
      (key) => delete filterQuery[key],
    );
    let filterStr = JSON.stringify(filterQuery);
    filterStr = filterStr.replaceAll(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);
    const totalDocs = await Post.countDocuments(JSON.parse(filterStr));

    // Build and execute the feature-enriched query
    const features = new APIFeatures(
      Post.find().populate("author", "name email"), // populate() joins User fields
      req.query,
    )
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const posts = await features.query;
    const { page, limit } = features.paginationMeta;

    res.json({
      success: true,
      // Pagination metadata
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1,
      },
      results: posts.length,
      data: { posts },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve posts",
      message: error.message,
    });
  }
});

// -----------------------------------------------------------------------
// GET /api/posts/:id
// Returns a single post with the author's name & email populated
// -----------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    // populate("author", "name email") — relationship join
    // Fetches linked User doc and embeds only name + email fields
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name email",
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
        message: `No post found with id: ${req.params.id}`,
      });
    }

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve post",
      message: error.message,
    });
  }
});

// -----------------------------------------------------------------------
// POST /api/posts  (protected)
// Creates a new post. Author is taken from the JWT, not request body.
// -----------------------------------------------------------------------
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, body, tags, published } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "title and body are required",
      });
    }

    const post = await Post.create({
      title,
      body,
      tags: tags || [],
      published: published || false,
      author: req.user.userId, // set from JWT, users cannot spoof authorship
    });

    // Populate author before responding
    await post.populate("author", "name email");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: { post },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Failed to create post",
      message: error.message,
    });
  }
});

// -----------------------------------------------------------------------
// PUT /api/posts/:id  (protected — only the post's author can update)
// -----------------------------------------------------------------------
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
        message: `No post found with id: ${req.params.id}`,
      });
    }

    // Ownership check: prevent users from editing each other's posts
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You can only edit your own posts",
      });
    }

    const { title, body, tags, published } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, body, tags, published },
      { new: true, runValidators: true }, // new: true returns the updated doc
    ).populate("author", "name email");

    res.json({
      success: true,
      message: "Post updated successfully",
      data: { post: updatedPost },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Failed to update post",
      message: error.message,
    });
  }
});

// -----------------------------------------------------------------------
// DELETE /api/posts/:id  (protected — only the post's author can delete)
// -----------------------------------------------------------------------
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
        message: `No post found with id: ${req.params.id}`,
      });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You can only delete your own posts",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(204).json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete post",
      message: error.message,
    });
  }
});

module.exports = router;
