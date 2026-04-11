# Week 6 — Relationships, Pagination & Query Optimization

## What We're Building
A blog API where **Users** write **Posts**. This week we introduce:
- Data **relationships** between two MongoDB collections
- **Pagination**, **filtering**, **sorting**, and **field projection** via query strings
- **Database indexes** to keep queries fast as data grows

---

## Mental Model

```
Client Request
     │
     ▼
Express Router
     │
     ├── middleware/auth.js  (verifyToken — protects write routes)
     │
     ▼
Controller / Route Handler
     │
     ├── APIFeatures(Post.find(), req.query)
     │       .filter()       ← ?published=true&views[gte]=10
     │       .search()       ← ?search=express tutorial
     │       .sort()         ← ?sort=-createdAt
     │       .limitFields()  ← ?fields=title,author
     │       .paginate()     ← ?page=2&limit=5
     │
     ▼
MongoDB Atlas
     │
     ├── Post collection  (has "author" field → ObjectId ref → User)
     └── User collection
           ▲
           └── populate("author", "name email")  ← Mongoose joins here
```

---

## Key Concept 1 — Relationships (refs + populate)

MongoDB doesn't have foreign keys like SQL. Instead we store an **ObjectId reference** in one document that points to a document in another collection.

### Defining the relationship in the Post model

```js
// models/Post.js
author: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",   // <-- tells Mongoose which model to look up
  required: true,
}
```

`author` stores only the User's `_id` — a 24-character hex string like `69bd9601ff4fe558e4856038`.

### Reading the relationship — populate()

Without populate, a post looks like:
```json
{ "title": "...", "author": "69bd9601ff4fe558e4856038" }
```

With `.populate("author", "name email")`, Mongoose runs a second query and embeds the User fields:
```json
{
  "title": "...",
  "author": { "_id": "69bd...", "name": "Alice Smith", "email": "alice@example.com" }
}
```

```js
// Fetch one post and embed author info
const post = await Post.findById(id).populate("author", "name email");

// Fetch all posts and embed author info
const posts = await Post.find().populate("author", "name email");
```

> **Rule of thumb:** Only `.populate()` the fields the client actually needs.
> Embedding the whole user document wastes bandwidth.

### Ownership check (security)

When updating or deleting, always verify the logged-in user owns the resource:

```js
if (post.author.toString() !== req.user.userId) {
  return res.status(403).json({ success: false, error: "Forbidden" });
}
```

`post.author` is an ObjectId object; `.toString()` converts it for comparison.

---

## Key Concept 2 — Database Indexes

An **index** is a data structure MongoDB maintains alongside a collection to make queries faster — similar to an index at the back of a book.

> Without an index, MongoDB must scan every document in the collection (*collection scan*).
> With an index, it jumps directly to matching documents (*index scan*).

### Types of indexes used this week

```js
// models/Post.js

// 1. Simple index — speeds up "find all posts by this user"
postSchema.index({ author: 1 });

// 2. Compound index — speeds up "get published posts sorted by date" (very common query)
postSchema.index({ published: 1, createdAt: -1 });

// 3. Text index — enables full-text search on these fields
postSchema.index({ title: "text", body: "text" });

// 4. Array field index — speeds up filtering by tag
postSchema.index({ tags: 1 });
```

- `1` = ascending order
- `-1` = descending order

### When to add an index
Add an index on any field that appears in:
- `.find({ field: value })` — filtering
- `.sort({ field: 1 })` — sorting
- `.populate()` references

> **Trade-off:** Indexes speed up reads but slow down writes (MongoDB must update the index
> on every insert/update). Don't index every field — only the ones you actually query.

---

## Key Concept 3 — The APIFeatures Class

Rather than hardcoding filter/sort/pagination logic inside every route, we encapsulate it in a **reusable class** that wraps a Mongoose query and progressively refines it.

```js
// Typical usage in a route handler
const features = new APIFeatures(Post.find(), req.query)
  .filter()       // step 1 — apply field filters
  .search()       // step 2 — full-text search
  .sort()         // step 3 — order results
  .limitFields()  // step 4 — select only requested fields
  .paginate();    // step 5 — slice to the right page

const posts = await features.query; // Mongoose executes here
```

### filter() — field-based filtering

Converts query strings like `?published=true&views[gte]=10` into a MongoDB filter.

```
?published=true             → { published: true }
?views[gte]=10              → { views: { $gte: 10 } }
?published=true&tags=node   → { published: true, tags: "node" }
```

The `[gte]`, `[gt]`, `[lte]`, `[lt]` operators map directly to MongoDB comparison operators after a string replace adds the `$` prefix.

```js
filter() {
  const queryObj = { ...this.queryString };
  ["page", "sort", "limit", "fields", "search"].forEach(k => delete queryObj[k]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, m => `$${m}`);

  this.query = this.query.find(JSON.parse(queryStr));
  return this;
}
```

### sort() — ordering results

```
?sort=-createdAt          → newest first
?sort=title               → alphabetical A→Z
?sort=-views,title        → most viewed first, then alphabetical
```

```js
sort() {
  const sortBy = this.queryString.sort
    ? this.queryString.sort.split(",").join(" ")
    : "-createdAt"; // default: newest first
  this.query = this.query.sort(sortBy);
  return this;
}
```

### limitFields() — field projection

Reduces response payload by returning only the fields the client asks for:

```
?fields=title,author,createdAt   → only those three fields
```

```js
limitFields() {
  const fields = this.queryString.fields
    ? this.queryString.fields.split(",").join(" ")
    : "-__v"; // default: everything except __v
  this.query = this.query.select(fields);
  return this;
}
```

### paginate() — slicing large datasets

```
?page=2&limit=5   → skip the first 5, return the next 5
```

```
page 1  →  skip 0,  limit 5   (documents 1–5)
page 2  →  skip 5,  limit 5   (documents 6–10)
page 3  →  skip 10, limit 5   (documents 11–15)

formula: skip = (page - 1) * limit
```

```js
paginate() {
  const page  = Math.max(1, Number(this.queryString.page)  || 1);
  const limit = Math.min(100, Math.max(1, Number(this.queryString.limit) || 10));
  const skip  = (page - 1) * limit;
  this.query  = this.query.skip(skip).limit(limit);
  this.paginationMeta = { page, limit };
  return this;
}
```

The `Math.min(100, ...)` cap prevents clients from requesting all documents at once.

### Pagination metadata in the response

The API always returns metadata so clients can build "Next / Previous" buttons:

```json
{
  "success": true,
  "pagination": {
    "totalDocs": 23,
    "totalPages": 5,
    "currentPage": 2,
    "limit": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  },
  "results": 5,
  "data": { "posts": [ ... ] }
}
```

---

## Project Structure

```
week6-relationships-pagination/
├── index.js                      ← entry point, wires everything together
├── .env                          ← MONGO_URI, JWT_SECRET, PORT
├── config/
│   └── db.js                     ← mongoose.connect()
├── models/
│   ├── User.js                   ← email index, bcrypt pre-save hook
│   └── Post.js                   ← author ref, compound/text/tag indexes
├── utils/
│   └── apiFeatures.js            ← filter / sort / fields / paginate
├── middleware/
│   ├── auth.js                   ← JWT verifyToken
│   └── errorHandler.js           ← centralized error responses
└── routes/
    ├── auth.js                   ← POST /auth/register, POST /auth/login
    ├── posts.js                  ← CRUD on /api/posts
    └── users.js                  ← /api/users/me, /api/users/:id/posts
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Get JWT token |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | No | List posts (filterable, paginated) |
| GET | `/api/posts/:id` | No | Get single post with populated author |
| POST | `/api/posts` | Yes | Create a post |
| PUT | `/api/posts/:id` | Yes (owner) | Update a post |
| DELETE | `/api/posts/:id` | Yes (owner) | Delete a post |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Yes | Own profile + post count |
| GET | `/api/users/:id/posts` | No | All posts by a user (paginated) |

---

## Query String Cheat Sheet

All query parameters can be combined freely.

```bash
# Pagination
GET /api/posts?page=2&limit=5

# Sort (prefix - for descending)
GET /api/posts?sort=-createdAt
GET /api/posts?sort=-views,title

# Filter exact value
GET /api/posts?published=true
GET /api/posts?tags=node

# Filter with comparison operators
GET /api/posts?views[gte]=100
GET /api/posts?views[gt]=0&views[lte]=500

# Field projection
GET /api/posts?fields=title,tags,createdAt

# Full-text search (requires text index)
GET /api/posts?search=express tutorial

# Combined
GET /api/posts?published=true&sort=-views&page=1&limit=5&fields=title,author
```

---

## Running the Project

```bash
cd week6-relationships-pagination

# Install dependencies
yarn install

# Edit .env — set your MONGO_URI and JWT_SECRET
# Then start the server
yarn dev
```

Run the bundled test script to call every endpoint:
```bash
bash test.sh
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `.toString()` when comparing ObjectIds | `post.author.toString() !== req.user.userId` |
| Using `populate()` without a `ref` in the schema | Add `ref: "ModelName"` to the ObjectId field |
| Not counting documents before `.skip().limit()` for total pages | Run `Model.countDocuments(filter)` separately |
| Indexing every field "just in case" | Only index fields used in filters, sorts, or joins |
| Returning hashed passwords in API responses | Set `select: false` on the password field in the schema |
