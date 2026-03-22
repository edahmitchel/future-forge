require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Week 6 — Relationships, Pagination & Query Optimization",
    endpoints: {
      auth: "/auth  (POST /register, POST /login)",
      posts: "/api/posts  (GET, POST, GET/:id, PUT/:id, DELETE/:id)",
      users: "/api/users/:id/posts  (GET — user's posts with pagination)",
      me: "/api/users/me  (GET — own profile + post count)",
    },
    queryExamples: {
      pagination: "/api/posts?page=1&limit=5",
      sort: "/api/posts?sort=-createdAt",
      filter: "/api/posts?published=true&views[gte]=10",
      fields: "/api/posts?fields=title,author,createdAt",
      search: "/api/posts?search=express+tutorial",
      combined: "/api/posts?published=true&sort=-views&page=1&limit=5",
    },
  });
});

app.use("/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// 404 — unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler (must be last)
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(
        "  Visit http://localhost:" + PORT + " for available endpoints\n",
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
