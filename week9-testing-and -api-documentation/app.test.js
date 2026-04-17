const request = require("supertest");
const app = require("./app");

describe("Blog API Tests", () => {
  describe("GET /", () => {
    it("should return welcome message", async () => {
      const response = await request(app).get("/");

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Welcome to Blog API");
    });
  });

  describe("GET /api/posts", () => {
    it("should return all posts", async () => {
      const response = await request(app).get("/api/posts");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should have post properties", async () => {
      const response = await request(app).get("/api/posts");

      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("title");
      expect(response.body.data[0]).toHaveProperty("content");
      expect(response.body.data[0]).toHaveProperty("author");
    });
  });

  describe("GET /api/posts/:id", () => {
    it("should return a single post by ID", async () => {
      const response = await request(app).get("/api/posts/1");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it("should return 404 for non-existent post", async () => {
      const response = await request(app).get("/api/posts/999");

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Post not found");
    });
  });

  describe("POST /api/posts", () => {
    it("should create a new post", async () => {
      const newPost = {
        title: "Test Post",
        content: "This is a test",
        author: "Charlie",
      };

      const response = await request(app).post("/api/posts").send(newPost);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Test Post");
      expect(response.body.data.author).toBe("Charlie");
    });

    it("should return 400 if missing required fields", async () => {
      const response = await request(app)
        .post("/api/posts")
        .send({ title: "Incomplete" });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/posts/:id", () => {
    it("should update an existing post", async () => {
      const updates = { title: "Updated Title" };
      const response = await request(app).put("/api/posts/1").send(updates);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Title");
    });

    it("should return 404 for non-existent post", async () => {
      const response = await request(app)
        .put("/api/posts/999")
        .send({ title: "Update" });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/posts/:id", () => {
    it("should delete a post", async () => {
      const response = await request(app).delete("/api/posts/2");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(2);
    });

    it("should return 404 for non-existent post", async () => {
      const response = await request(app).delete("/api/posts/999");

      expect(response.statusCode).toBe(404);
    });
  });
});
