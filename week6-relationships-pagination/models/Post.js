const mongoose = require("mongoose");

// Post belongs to a User via ObjectId reference (relationship)
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A post must have a title"],
      trim: true,
      maxlength: [150, "Title cannot be longer than 150 characters"],
    },
    body: {
      type: String,
      required: [true, "A post must have a body"],
    },
    tags: {
      type: [String],
      default: [],
    },
    published: {
      type: Boolean,
      default: false,
    },
    // Relationship: each post is owned by exactly one user
    // populate() will use this ref to join User documents
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A post must have an author"],
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// --- Indexes for Query Optimization ---

// Compound index: common query pattern is "all published posts sorted by date"
postSchema.index({ published: 1, createdAt: -1 });

// Text index: enables full-text search on title and body
postSchema.index({ title: "text", body: "text" });

// Index on author speeds up "posts by a specific user" queries
postSchema.index({ author: 1 });

// Index on tags array supports filtering by tag
postSchema.index({ tags: 1 });

module.exports = mongoose.model("Post", postSchema);
