// ============================================
// IMPORTS - Bring in external libraries
// ============================================

// Express: Framework for building web servers and APIs
const express = require("express");

// Swagger JSDoc: Converts JSDoc comments above routes into Swagger documentation
const swaggerJsdoc = require("swagger-jsdoc");

// Swagger UI Express: Displays interactive API documentation in the browser
const swaggerUi = require("swagger-ui-express");

// Create an Express application
const app = express();

// ============================================
// MIDDLEWARE - Process requests before routes
// ============================================

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE
// ============================================
// NOTE: This data resets every time the server restarts
// In production you would use MongoDB, PostgreSQL, etc.

let posts = [
  { id: 1, title: "First Post", content: "Hello World", author: "Alice" },
  { id: 2, title: "Second Post", content: "Node.js is great", author: "Bob" },
];

// ============================================
// SWAGGER CONFIGURATION - API Documentation
// ============================================
// These options tell Swagger how to document our API

const swaggerOptions = {
  definition: {
    // OpenAPI 3.0.0 is the current standard for API documentation
    openapi: "3.0.0",

    // Basic info about our API
    info: {
      title: "Blog API",
      version: "1.0.0",
      description: "A simple blog API with CRUD operations",
    },

    // Where the API runs (development server)
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },

  // Tell Swagger to look for documentation comments in this file
  apis: ["./app.js"],
};

// Generate the Swagger spec from our annotations
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Set up the /api-docs route to display Swagger UI in the browser
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// ROUTES - API Endpoints
// ============================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     responses:
 *       200:
 *         description: Welcome message
 */
// Route 1: Welcome endpoint
// Simple GET to the root path - returns a welcome message
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Blog API", docs: "/api-docs" });
});

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Route 2: Get all posts (READ - no authentication needed)
// No parameters required - returns the entire posts array
app.get("/api/posts", (req, res) => {
  res.json({ success: true, data: posts });
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post found
 *       404:
 *         description: Post not found
 */
// Route 3: Get single post by ID (READ)
// :id is a route parameter - accessible via req.params.id
// Returns the post if found, or 404 if it doesn't exist
app.get("/api/posts/:id", (req, res) => {
  // req.params.id comes from the URL (e.g. /api/posts/1 → id = "1")
  // We use Number() to convert the string "1" to the integer 1
  const post = posts.find((p) => p.id === Number(req.params.id));

  // If post doesn't exist, return 404 (Not Found)
  if (!post) {
    return res.status(404).json({ success: false, error: "Post not found" });
  }

  // Post found - return it with 200 OK (default status)
  res.json({ success: true, data: post });
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Missing required fields
 */
// Route 4: Create new post (CREATE)
// Expects JSON body: { title, content, author }
// Returns 201 (Created) on success, 400 (Bad Request) if fields are missing
app.post("/api/posts", (req, res) => {
  // Destructure the fields from the request body
  // express.json() middleware must be above for this to work
  const { title, content, author } = req.body;

  // VALIDATION: All three fields are required
  if (!title || !content || !author) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: title, content, author",
    });
  }

  // Generate a new unique ID: find the highest existing ID and add 1
  // If the array is empty, start at 1
  const newPost = {
    id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
    title,
    content,
    author,
  };

  // Add the new post to the array
  posts.push(newPost);

  // 201 Created - return the newly created post
  res.status(201).json({ success: true, data: newPost });
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Post updated
 *       404:
 *         description: Post not found
 */
// Route 5: Update existing post (UPDATE)
// :id from URL tells us which post to update
// Body can contain any fields to update (title, content, author)
app.put("/api/posts/:id", (req, res) => {
  // Find the post object in the array
  const post = posts.find((p) => p.id === Number(req.params.id));

  // If it doesn't exist, return 404
  if (!post) {
    return res.status(404).json({ success: false, error: "Post not found" });
  }

  // Object.assign() copies properties from req.body onto the post object
  // Only the fields provided in the body will be updated
  Object.assign(post, req.body);

  res.json({ success: true, data: post });
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted
 *       404:
 *         description: Post not found
 */
// Route 6: Delete a post (DELETE)
// :id from URL tells us which post to remove
// Returns the deleted post so the client knows what was removed
app.delete("/api/posts/:id", (req, res) => {
  // findIndex() returns the position in the array (-1 if not found)
  // We need the index to use splice()
  const index = posts.findIndex((p) => p.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Post not found" });
  }

  // splice(index, 1) removes 1 item at that index and returns it as an array
  const deletedPost = posts.splice(index, 1);

  res.json({ success: true, data: deletedPost[0] });
});

// ============================================
// EXPORTS & SERVER START
// ============================================

// Export the app so Jest/Supertest can import it during tests
// Tests make requests directly to the app without starting a server
module.exports = app;

// Only start listening if this file is run directly (e.g. node app.js / npm start)
// When Jest runs tests, NODE_ENV is set to "test" so this block is skipped
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000; // Use PORT env var or default to 3000

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`📚 API docs available at http://localhost:${PORT}/api-docs`);
  });
}
