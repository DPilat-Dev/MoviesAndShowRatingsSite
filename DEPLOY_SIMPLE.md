# Bosnia Movie Rankings - Simple Production Deployment

## Quick Start

### 1. Prepare Environment
```bash
# Copy environment file
cp .env.production .env

# Edit with your values
nano .env
```

**Minimum `.env` configuration:**
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_32_character_jwt_secret
CORS_ORIGIN=https://yourdomain.com  # Your Nginx Proxy Manager domain
```

### 2. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Verify Services
```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

## Services Exposed
- **Frontend**: Port 3000 → http://localhost:3000
- **Backend API**: Port 5000 → http://localhost:5000
- **PostgreSQL**: Port 5432 → localhost:5432

## Nginx Proxy Manager Configuration

### Option 1: Single Domain (Recommended)
Create one proxy host in NPM:

**Domain**: `app.yourdomain.com`
**Forward to**: `[LXC_IP]:3000`
**SSL**: Enable

**Advanced Configuration:**
```nginx
location /api {
    proxy_pass http://[LXC_IP]:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### Option 2: Separate Domains
- **Frontend**: `app.yourdomain.com` → `[LXC_IP]:3000`
- **Backend**: `api.yourdomain.com` → `[LXC_IP]:5000`

## Maintenance Commands

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### Database Backup
```bash
# Backup database
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U movierankings movierankings > backup.sql

# Restore database
cat backup.sql | docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U movierankings movierankings
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs

# Specific service
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs postgres
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check disk space
df -h

# Check if ports are in use
netstat -tulpn | grep -E ':3000|:5000|:5432'
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U movierankings

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres
```

### Frontend can't connect to backend
1. Check `.env` file has correct `VITE_API_URL`
2. Verify backend is running: `curl http://localhost:5000/api/health`
3. Check CORS settings in `.env`

## Security Notes
1. Change default passwords in `.env`
2. Use strong JWT secret (32+ characters)
3. Enable SSL in Nginx Proxy Manager
4. Regular updates: `docker-compose -f docker-compose.production.yml pull`

## That's it! Your application is now running in production. 🎬