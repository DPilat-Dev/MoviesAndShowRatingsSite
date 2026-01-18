#!/bin/bash

# Bosnia Movie Rankings - Simple Deployment Script
# For use with docker-compose.prod-final.yml

set -e

echo "🚀 Deploying Bosnia Movie Rankings..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.production ]; then
        cp .env.production .env
    else
        echo "❌ No .env.production template found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "📦 Building and starting containers..."
docker-compose -f docker-compose.prod-final.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service status..."
docker-compose -f docker-compose.prod-final.yml ps

echo "✅ Deployment complete!"
echo ""
echo "📊 Services running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "📝 For Nginx Proxy Manager configuration:"
echo "   - Frontend: Proxy yourdomain.com → [LXC_IP]:3000"
echo "   - Backend API: Proxy api.yourdomain.com → [LXC_IP]:5000 (optional)"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod-final.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod-final.yml down"
echo "   Restart: docker-compose -f docker-compose.prod-final.yml restart"
echo "   Update: docker-compose -f docker-compose.prod-final.yml up -d --build"