# 📝 Assignment: Blog Platform with Admin Dashboard

## Overview
Build a full-stack blog platform where users can create/read articles, leave comments, and admins can manage content with analytics. This project combines all concepts you've learned.

## Technical Requirements

### Database Models (Week 3 concepts):
- **User** - (already exists, extend with `bio`, `profileImage`)
- **Post** - title, content, author, created/updated dates, published status
- **Comment** - content, author, post reference, created date, likes count

## Features by User Role

### Regular Users:
- Register & login (JWT auth - Week 5)
- Create, edit, delete own posts
- View all posts and comments
- Comment on posts
- Like comments
- View own profile
- Cannot delete other users' content

### Admins:
- All user features PLUS:
- Delete/unpublish any post
- Delete any comment
- View dashboard with analytics:
  - Total posts, total comments, total users
  - Most liked posts/comments
  - User activity trends (posts/comments created today, this week)
  - List all users with their post counts

### Public:
- View published posts only
- Cannot comment without login

## API Endpoints to Implement

### Auth (existing routes, may need tweaks):
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/create-admin` - Create admin account

### Posts:
- `POST /api/posts` - Create post (requires auth)
- `GET /api/posts` - Get all published posts (public)
- `GET /api/posts/my` - Get current user's posts (auth required)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update own post
- `DELETE /api/posts/:id` - Delete own post
- `PATCH /api/posts/:id/publish` - Toggle publish status

### Comments:
- `POST /api/posts/:id/comments` - Create comment (auth required)
- `GET /api/posts/:id/comments` - Get post comments
- `DELETE /api/comments/:id` - Delete own comment
- `PATCH /api/comments/:id/like` - Like/unlike comment

### Admin Dashboard:
- `GET /api/admin/dashboard` - Analytics data
- `DELETE /api/admin/posts/:id` - Force delete any post
- `DELETE /api/admin/comments/:id` - Force delete any comment

## Skills Demonstrated

✅ **JavaScript** (W1) - Functions, data manipulation, control flow  
✅ **Express** (W2) - Routing, middleware, HTTP methods, request/response  
✅ **MongoDB** (W2-3) - Schemas, models, relationships, queries  
✅ **Authentication** (W5) - JWT, password hashing, token verification  
✅ **Authorization** (W5) - Role-based access control, middleware chains  
✅ **Error Handling** - Status codes, validation, security  
✅ **Software Design** - Separation of concerns, reusable middleware

## Deliverables
1. Complete folder structure with models, routes, middleware
2. All endpoints working with proper error handling
3. Middleware for protecting routes based on role
4. MongoDB schemas with proper validation and relationships
5. Environment variables configured
6. Testing the API with sample requests

## Bonus Challenges (if you finish early)
- Add pagination to posts/comments listings
- Search posts by title/content
- Add post categories/tags
- Implement soft deletes (mark as deleted, don't remove)
- Add email notifications on new comments (or log them)
- Rate limiting on API endpoints
