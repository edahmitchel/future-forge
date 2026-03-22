#!/bin/bash
BASE="http://localhost:3000"
TOKEN=""

echo "=== 1. Health Check ==="
curl -s "$BASE/" | jq '{success,message}'

echo ""
echo "=== 2. Register ==="
REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Jones","email":"bob@test.com","password":"pass1234"}')
echo "$REGISTER" | jq '{success,message}'

echo ""
echo "=== 3. Login ==="
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"pass1234"}')
echo "$LOGIN" | jq '{success,message}'
TOKEN=$(echo "$LOGIN" | jq -r '.data.token')
echo "Token received: $([ -n "$TOKEN" ] && echo YES || echo NO)"

echo ""
echo "=== 4. Create Post 1 (published=true) ==="
P1=$(curl -s -X POST "$BASE/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Getting Started with Express","body":"Express is a minimal Node.js framework.","tags":["node","express"],"published":true}')
echo "$P1" | jq '{success, title: .data.post.title, id: .data.post._id}'
POST1_ID=$(echo "$P1" | jq -r '.data.post._id')

echo ""
echo "=== 5. Create Post 2 (published=false) ==="
P2=$(curl -s -X POST "$BASE/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"MongoDB Indexing Tips","body":"Indexes improve query performance significantly.","tags":["mongodb","database"],"published":false}')
echo "$P2" | jq '{success, title: .data.post.title}'

echo ""
echo "=== 6. Create Post 3 (published=true) ==="
P3=$(curl -s -X POST "$BASE/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Pagination in REST APIs","body":"Pagination prevents large payloads.","tags":["api","express","node"],"published":true}')
echo "$P3" | jq '{success, title: .data.post.title}'

echo ""
echo "=== 7. GET /api/posts (all posts, default pagination) ==="
curl -s "$BASE/api/posts" | jq '{success, results, pagination}'

echo ""
echo "=== 8. GET /api/posts?published=true (filter) ==="
curl -s "$BASE/api/posts?published=true" | jq '{success, results, pagination}'

echo ""
echo "=== 9. GET /api/posts?sort=-createdAt&limit=2 (sort + limit) ==="
curl -s "$BASE/api/posts?sort=-createdAt&limit=2" | jq '{success, results, pagination, titles: [.data.posts[].title]}'

echo ""
echo "=== 10. GET /api/posts?fields=title,tags,published (field projection) ==="
curl -s "$BASE/api/posts?fields=title,tags,published" | jq '.data.posts[0]'

echo ""
echo "=== 11. GET /api/posts/:id (single post with populated author) ==="
curl -s "$BASE/api/posts/$POST1_ID" | jq '{success, title: .data.post.title, author: .data.post.author}'

echo ""
echo "=== 12. PUT /api/posts/:id (update post) ==="
curl -s -X PUT "$BASE/api/posts/$POST1_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Getting Started with Express (Updated)","body":"Updated body.","tags":["node","express","updated"],"published":true}' | jq '{success, title: .data.post.title, tags: .data.post.tags}'

echo ""
echo "=== 13. GET /api/users/me (own profile + post count) ==="
curl -s "$BASE/api/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, name: .data.user.name, postCount: .data.postCount}'

echo ""
echo "=== 14. GET /api/users/:id/posts (user's posts with pagination) ==="
USER_ID=$(echo "$LOGIN" | jq -r '.data.token' | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.userId' 2>/dev/null || echo "")
if [ -z "$USER_ID" ]; then
  # Fallback: decode JWT manually
  PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2)
  # Pad base64
  PADDED="$PAYLOAD$(python3 -c "print('=' * (4 - len('$PAYLOAD') % 4) if len('$PAYLOAD') % 4 else '')" 2>/dev/null)"
  USER_ID=$(echo "$PADDED" | base64 -d 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])" 2>/dev/null)
fi
echo "User ID: $USER_ID"
curl -s "$BASE/api/users/$USER_ID/posts?limit=2" | jq '{success, results, pagination}'

echo ""
echo "=== 15. Test 403 — edit someone else's post ==="
curl -s -X PUT "$BASE/api/posts/$POST1_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BADTOKEN" \
  -d '{"title":"Hacked","body":"x","tags":[],"published":false}' | jq '{success, error}'

echo ""
echo "=== 16. Test 404 — post not found ==="
curl -s "$BASE/api/posts/000000000000000000000000" | jq '{success, error}'

echo ""
echo "=== 17. DELETE /api/posts/:id ==="
curl -s -X DELETE "$BASE/api/posts/$POST1_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{success}'

echo ""
echo "=== All tests complete ==="
