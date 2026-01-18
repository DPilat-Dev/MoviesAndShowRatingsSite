#!/bin/bash

echo "=== Testing Bosnia Movie Rankings API ==="
echo

# Test 1: Backend direct access
echo "1. Testing backend direct access (port 5000):"
curl -s http://localhost:5000/health
echo
echo

# Test 2: Frontend proxy access
echo "2. Testing frontend proxy (port 3000 -> 5000):"
curl -s http://localhost:3000/api/health
echo
echo

# Test 3: API info endpoint
echo "3. Testing API info endpoint:"
curl -s http://localhost:3000/api/api | jq '.message' 2>/dev/null || curl -s http://localhost:3000/api/api | grep -o '"message":"[^"]*"' | head -1
echo
echo

# Test 4: Test users endpoint
echo "4. Testing users endpoint (GET):"
curl -s http://localhost:3000/api/api/users | head -50
echo
echo

# Test 5: Create a test user
echo "5. Creating a test user:"
curl -s -X POST http://localhost:3000/api/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "displayName": "Test User"}' | head -50
echo
echo

# Test 6: List users
echo "6. Listing all users:"
curl -s http://localhost:3000/api/api/users | head -100
echo
echo

echo "=== Test Complete ==="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "API via proxy: http://localhost:3000/api/*"