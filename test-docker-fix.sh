#!/bin/bash

echo "=== Testing Docker Fix for Prisma OpenSSL Issue ==="
echo ""

# Create a test Dockerfile with the fix
cat > Dockerfile.test << 'EOF'
FROM node:18-bullseye-slim

# Test OpenSSL installation
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Check OpenSSL version
RUN echo "=== OpenSSL Test ===" && \
    openssl version && \
    echo "" && \
    echo "=== Library Check ===" && \
    find /usr/lib -name "libssl*" -type f | head -5 && \
    echo "" && \
    echo "=== Prisma Compatibility Test ===" && \
    node -e "console.log('Node.js version:', process.version)" && \
    echo "System architecture: $(uname -m)" && \
    echo "Linux distribution: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
EOF

echo "1. Building test image..."
docker build -f Dockerfile.test -t prisma-openssl-test .

echo ""
echo "2. Running test container..."
docker run --rm prisma-openssl-test

echo ""
echo "3. Testing Prisma specifically..."
cat > prisma-test.js << 'EOF'
const { execSync } = require('child_process');
console.log('Testing Prisma requirements...');
try {
  // Check if we can require Prisma
  const prisma = require('@prisma/client');
  console.log('✅ @prisma/client can be required');
  
  // Check OpenSSL version
  const opensslVersion = execSync('openssl version').toString().trim();
  console.log(`✅ OpenSSL version: ${opensslVersion}`);
  
  // Check libssl
  const libsslCheck = execSync('find /usr/lib -name "libssl*.so*" -type f 2>/dev/null | head -3').toString().trim();
  console.log('✅ Found libssl libraries:');
  console.log(libsslCheck.split('\n').map(lib => `  - ${lib}`).join('\n'));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
EOF

docker run --rm -v $(pwd)/prisma-test.js:/test.js prisma-openssl-test node /test.js

echo ""
echo "Cleaning up..."
rm -f Dockerfile.test prisma-test.js
docker rmi prisma-openssl-test 2>/dev/null || true

echo ""
echo "=== Test Complete ==="
echo "If all tests pass, the Docker setup should work with Prisma."
echo "To run the full application: docker-compose -f docker-compose.dev.yml up"