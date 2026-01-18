# Bosnia Movie Rankings - Production Deployment Guide

## Prerequisites

1. **Docker & Docker Compose** installed on your server
2. **Domain name** (optional but recommended)
3. **SSL certificates** (optional but recommended for HTTPS)

## Quick Start

### 1. Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Setup the Project

```bash
# Clone the repository
git clone <your-repo-url>
cd BosniaMovieRankings

# Copy environment file
cp .env.production.example .env.production

# Edit the environment file with your values
nano .env.production
```

### 3. Configure Environment Variables

Edit `.env.production` with these minimum required values:

```bash
POSTGRES_PASSWORD=your_very_secure_password_here
JWT_SECRET=your_32_character_minimum_secret_key_here
```

Optional but recommended:
```bash
VITE_OMDB_API_KEY=your_omdb_api_key  # For movie details
```

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 5. Verify Deployment

1. **Check if services are running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Test the application:**
   - Frontend: http://your-server-ip
   - Backend API: http://your-server-ip:5000/api/health

3. **Check logs for errors:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   docker-compose -f docker-compose.prod.yml logs frontend
   ```

## Advanced Configuration

### Using a Domain Name with Nginx Proxy

1. **Update DNS** to point your domain to your server IP
2. **Modify `nginx.prod.conf`**:
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

### Adding SSL/HTTPS (Recommended)

#### Option A: Using Let's Encrypt with Nginx Proxy

Create a separate nginx proxy service:

```yaml
# Add to docker-compose.prod.yml
nginx-proxy:
  image: nginx:stable-alpine
  container_name: bosnia-movie-nginx-proxy
  depends_on:
    - frontend
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/ssl:/etc/nginx/ssl:ro
    - ./nginx/proxy.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
  networks:
    - app-network
  restart: unless-stopped
```

#### Option B: Using Traefik or Caddy

These are simpler alternatives that handle SSL automatically.

### Database Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U movierankings movierankings > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### Monitoring and Logging

1. **Set up log rotation** (already configured in docker-compose)
2. **Monitor resource usage**:
   ```bash
   docker stats
   ```
3. **Set up health checks** (already configured)

## Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Database Maintenance

```bash
# Access PostgreSQL console
docker-compose -f docker-compose.prod.yml exec postgres psql -U movierankings

# Run Prisma migrations (if needed)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Scaling (For Higher Traffic)

1. **Increase backend replicas**:
   ```yaml
   backend:
     deploy:
       replicas: 2
   ```

2. **Add a load balancer** in front of the backend services

3. **Use a CDN** for static assets

## Troubleshooting

### Common Issues

1. **"Connection refused" to database**:
   ```bash
   # Check if PostgreSQL is running
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Check health status
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U movierankings
   ```

2. **Frontend can't connect to backend**:
   ```bash
   # Check backend health
   curl http://localhost:5000/api/health
   
   # Check nginx configuration
   docker-compose -f docker-compose.prod.yml exec frontend nginx -t
   ```

3. **Out of memory errors**:
   - Increase memory limits in `docker-compose.prod.yml`
   - Add swap space to your server

4. **Application crashes on startup**:
   ```bash
   # Check all logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Rebuild from scratch
   docker-compose -f docker-compose.prod.yml down -v
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Log Locations

- **Application logs**: `docker-compose -f docker-compose.prod.yml logs [service]`
- **Docker logs**: `/var/lib/docker/containers/`
- **Nginx logs**: Inside frontend container at `/var/log/nginx/`

## Security Best Practices

1. **Change default passwords** in `.env.production`
2. **Use strong JWT secret** (minimum 32 characters)
3. **Enable firewall** on your server:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Regular updates**:
   ```bash
   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   ```
5. **Regular backups** of database and configuration

## Performance Optimization

1. **Enable gzip compression** (already in nginx config)
2. **Set appropriate cache headers** (configured for static assets)
3. **Database indexing** (Prisma handles this)
4. **CDN for images** (consider using Cloudinary or similar)

## Backup and Recovery

### Full Backup
```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U movierankings movierankings > backup.sql

# Backup configuration
tar -czf config_backup.tar.gz .env.production docker-compose.prod.yml
```

### Restore from Backup
```bash
# Restore database
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U movierankings movierankings

# Restore configuration
tar -xzf config_backup.tar.gz
```

## Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this deployment guide
3. Check the project's GitHub issues
4. Contact the development team

---

**Next Steps After Deployment:**
1. Set up monitoring (Prometheus + Grafana)
2. Configure automated backups
3. Set up SSL certificates
4. Configure a CDN for static assets
5. Set up email notifications for errors

Remember to test your deployment thoroughly before making it public!