#!/bin/bash

echo "Testing OpenSSL fix for Docker..."

# Create a simple test Dockerfile
cat > Dockerfile.test << 'EOF'
FROM node:18-slim

# Test OpenSSL installation
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Check if OpenSSL is available
RUN echo "Testing OpenSSL..." && \
    openssl version && \
    echo "Checking for libssl..." && \
    find /usr/lib -name "libssl*" -type f | head -5

# Test Prisma requirements
RUN echo "Creating test for Prisma..." && \
    mkdir -p /test && cd /test && \
    npm init -y && \
    npm install @prisma/client && \
    echo "Prisma installed successfully"
EOF

echo "Dockerfile created. Testing build..."
docker build -f Dockerfile.test -t openssl-test .

echo "Running test container..."
docker run --rm openssl-test sh -c "
  echo '=== OpenSSL Test Results ==='
  openssl version
  echo ''
  echo '=== Library Check ==='
  ls -la /usr/lib/x86_64-linux-gnu/libssl* 2>/dev/null || echo 'No libssl in expected location'
  echo ''
  echo '=== Prisma Test ==='
  cd /test && ls -la node_modules/@prisma/client/
"

echo "Cleaning up..."
rm -f Dockerfile.test
docker rmi openssl-test 2>/dev/null || true

echo "Test complete!"