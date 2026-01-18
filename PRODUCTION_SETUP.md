# Bosnia Movie Rankings - Production Setup

## Quick Start

### 1. Prepare Environment
```bash
# Copy environment template
cp .env.production .env

# Edit with your values
nano .env
```

**Minimum `.env` configuration:**
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_32_character_jwt_secret
VITE_API_URL=/api  # For Nginx Proxy Manager
```

### 2. Deploy
```bash
# Option A: Use deployment script
./deploy.sh

# Option B: Manual deployment
docker-compose -f docker-compose.prod-final.yml up -d --build
```

### 3. Verify
```bash
# Check services
docker-compose -f docker-compose.prod-final.yml ps

# Test endpoints
curl http://localhost:3000
curl http://localhost:5000/api/health
```

## Services
- **Frontend**: Port 3000 → Static React app
- **Backend API**: Port 5000 → Node.js/Express API
- **PostgreSQL**: Port 5432 → Database

## Nginx Proxy Manager Configuration

### Single Domain (Recommended)
1. Create proxy host: `app.yourdomain.com`
2. Forward to: `[LXC_IP]:3000`
3. Enable SSL
4. Add advanced configuration:
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

## Maintenance

### Update Application
```bash
git pull origin main
docker-compose -f docker-compose.prod-final.yml up -d --build
```

### Database Backup
```bash
docker-compose -f docker-compose.prod-final.yml exec postgres \
  pg_dump -U movierankings movierankings > backup.sql
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod-final.yml logs

# Specific service
docker-compose -f docker-compose.prod-final.yml logs backend
docker-compose -f docker-compose.prod-final.yml logs frontend
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose -f docker-compose.prod-final.yml logs

# Check ports
netstat -tulpn | grep -E ':3000|:5000|:5432'
```

### Database issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod-final.yml exec postgres pg_isready -U movierankings

# Reset database (⚠️ deletes all data)
docker-compose -f docker-compose.prod-final.yml down -v
docker-compose -f docker-compose.prod-final.yml up -d --build
```

## Security Notes
1. Change default passwords in `.env`
2. Use strong JWT secret
3. Enable SSL in Nginx Proxy Manager
4. Regular updates: `docker-compose -f docker-compose.prod-final.yml pull`

## That's it! Your application is now running in production. 🎬