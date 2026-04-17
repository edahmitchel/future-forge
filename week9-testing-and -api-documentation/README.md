# Blog API - Testing & Documentation Demo

A simple Node.js Express API with Swagger documentation and Jest tests.

## Features

- ✅ Express.js REST API
- ✅ Swagger API documentation
- ✅ Jest unit tests with supertest
- ✅ CRUD operations for blog posts

## Setup

```bash
# Install dependencies
npm install

# Start server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Development with hot reload
npm run dev
```

## API Documentation

Once the server is running, visit:

```
http://localhost:3000/api-docs
```

## Endpoints

- `GET /` - Welcome message
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Test Coverage

Run tests with:

```bash
npm test
```

Tests include:

- Welcome endpoint
- Get all posts
- Get single post by ID
- Get non-existent post (404)
- Create new post
- Create with missing fields
- Update existing post
- Delete post

## Project Structure

```
week9-testing-and-api-documentation/
├── app.js              # Main Express app with Swagger annotations
├── app.test.js         # Jest test suite
├── package.json        # Dependencies and scripts
├── jest.config.js      # Jest configuration
├── README.md           # This file
└── .gitignore          # Git ignore rules
```
