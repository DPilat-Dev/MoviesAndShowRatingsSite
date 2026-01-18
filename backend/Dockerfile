FROM node:18-slim AS builder

WORKDIR /app

# Install OpenSSL 1.1 for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    libssl1.1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client with explicit binary target
RUN npx prisma generate --no-engine

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install OpenSSL 1.1 and other required libraries
RUN apt-get update && apt-get install -y \
    openssl \
    libssl1.1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodejs
USER nodejs

EXPOSE 5000

CMD ["node", "dist/index.js"]