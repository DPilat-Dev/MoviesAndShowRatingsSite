#!/bin/bash

set -e

echo "🚀 Setting up Bosnia Movie Rankings Project"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create .env files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "DATABASE_URL=\"file:./dev.db\"" >> backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Setup SQLite database
echo "🗄️ Setting up SQLite database..."
npm run db:generate
npm run db:push

echo "✅ Backend setup complete!"
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "✅ Frontend setup complete!"
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application locally (without Docker):"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start the frontend (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "To start with Docker:"
echo "   docker-compose -f docker-compose.dev.yml up"
echo ""
echo "Happy ranking! 🎬"