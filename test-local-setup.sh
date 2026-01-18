#!/bin/bash

echo "=== Testing Local Setup (No Docker) ==="
echo ""

# Test backend
echo "1. Testing Backend..."
cd backend

echo "  - Installing dependencies..."
npm install 2>&1 | tail -5

echo "  - Generating Prisma client..."
npm run db:generate 2>&1 | tail -5

echo "  - Setting up database..."
npm run db:push 2>&1 | tail -5

echo "  - Seeding database..."
npm run db:seed 2>&1 | tail -5

echo "  - Building TypeScript..."
npm run build 2>&1 | tail -5

echo "✅ Backend setup complete!"
cd ..

echo ""
echo "2. Testing Frontend..."
cd frontend

echo "  - Installing dependencies..."
npm install 2>&1 | tail -5

echo "  - Building frontend..."
npm run build 2>&1 | tail -5

echo "✅ Frontend setup complete!"
cd ..

echo ""
echo "=== Setup Test Complete ==="
echo ""
echo "To start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "For Docker setup, use: docker-compose -f docker-compose.dev.yml up"