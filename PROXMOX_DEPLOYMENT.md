# Bosnia Movie Rankings - Proxmox LXC Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Proxmox Host                         │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │  LXC Container  │    │  Nginx Proxy Manager     │   │
│  │  (Ubuntu/Debian)│    │  (Separate Container)    │   │
│  │                 │    │                          │   │
│  │  ┌───────────┐  │    │  ┌────────────────────┐ │   │
│  │  │ PostgreSQL│  │    │  │ Proxy Hosts:       │ │   │
│  │  │ Container │  │    │  │ - app.yourdomain.com│ │   │
│  │  └───────────┘  │    │  │   → LXC:8080       │ │   │
│  │                 │    │  │ - api.yourdomain.com│ │   │
│  │  ┌───────────┐  │    │  │   → LXC:3001       │ │   │
│  │  │ Backend   │  │    │  └────────────────────┘ │   │
│  │  │ API       │  │    │                          │   │
│  │  └───────────┘  │    │                          │   │
│  │                 │    │                          │   │
│  │  ┌───────────┐  │    │                          │   │
│  │  │ Frontend  │  │    │                          │   │
│  │  │ (Static)  │  │    │                          │   │
│  │  └───────────┘  │    │                          │   │
│  │                 │    │                          │   │
│  │  ┌───────────┐  │    │                          │   │
│  │  │ Nginx     │  │    │                          │   │
│  │  │ (Static)  │  │    │                          │   │
│  │  └───────────┘  │    │                          │   │
│  └─────────────────┘    └──────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Create LXC Container in Proxmox

### 1.1 Create Container
1. In Proxmox Web UI, click "Create CT"
2. **Template**: Choose Ubuntu 22.04 or Debian 11
3. **Resources** (minimum):
   - CPU: 2 cores
   - Memory: 2048 MB
   - Swap: 1024 MB
   - Disk: 20 GB
   - Network: Bridge to your network

### 1.2 Configure Container
```bash
# After container creation, start it and open console
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Add your user to docker group (if needed)
usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

## Step 2: Prepare the Application

### 2.1 Transfer Files to LXC
```bash
# From your local machine, copy files to Proxmox host
scp -r BosniaMovieRankings/ root@proxmox-host:/var/lib/vz/snippets/

# Or clone directly in LXC
apt install -y git
git clone <your-repo-url>
cd BosniaMovieRankings
```

### 2.2 Configure Environment
```bash
# Copy environment template
cp .env.production.example .env.proxmox

# Edit with your values
nano .env.proxmox
```

**Minimum `.env.proxmox` configuration:**
```bash
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# Optional but recommended
VITE_OMDB_API_KEY=your_omdb_api_key_here

# CORS settings for your domain
CORS_ORIGIN=https://app.yourdomain.com
```

## Step 3: Deploy with Docker Compose

### 3.1 Start the Application
```bash
# Build and start all services
docker-compose -f docker-compose.proxmox.yml up -d

# Check status
docker-compose -f docker-compose.proxmox.yml ps

# View logs
docker-compose -f docker-compose.proxmox.yml logs -f
```

### 3.2 Verify Internal Services
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check nginx static server
curl http://localhost:8080

# Check database connection
docker-compose -f docker-compose.proxmox.yml exec postgres pg_isready -U movierankings
```

## Step 4: Configure Nginx Proxy Manager

### 4.1 Create Proxy Hosts in NPM

**Host 1: Frontend Application**
- **Domain**: `app.yourdomain.com` (or your preferred domain)
- **Scheme**: `http`
- **Forward Hostname**: `[LXC Container IP]`
- **Forward Port**: `8080`
- **SSL**: Enable SSL, request certificate
- **Advanced**:
  ```nginx
  # Custom Nginx configuration
  location /api {
      proxy_pass http://[LXC Container IP]:3001;
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

**Host 2: Backend API (Optional - for direct API access)**
- **Domain**: `api.yourdomain.com`
- **Scheme**: `http`
- **Forward Hostname**: `[LXC Container IP]`
- **Forward Port**: `3001`
- **SSL**: Enable SSL
- **Advanced**:
  ```nginx
  # CORS headers for API
  add_header 'Access-Control-Allow-Origin' 'https://app.yourdomain.com' always;
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
  add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
  
  # Handle preflight requests
  if ($request_method = 'OPTIONS') {
      add_header 'Access-Control-Allow-Origin' 'https://app.yourdomain.com';
      add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
      add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
      add_header 'Access-Control-Max-Age' 1728000;
      add_header 'Content-Type' 'text/plain; charset=utf-8';
      add_header 'Content-Length' 0;
      return 204;
  }
  ```

### 4.2 DNS Configuration
1. Add A records in your DNS provider:
   - `app.yourdomain.com` → Your public IP
   - `api.yourdomain.com` → Your public IP (optional)

2. Port forward in your router:
   - Port 80 → Nginx Proxy Manager
   - Port 443 → Nginx Proxy Manager

## Step 5: Security Configuration

### 5.1 LXC Container Security
```bash
# Update firewall (UFW)
apt install -y ufw
ufw allow 22/tcp  # SSH
ufw allow from [NPM Container IP] to any port 3001  # Backend API
ufw allow from [NPM Container IP] to any port 8080  # Frontend
ufw enable

# Disable root login (optional but recommended)
passwd -l root
```

### 5.2 Docker Security
```bash
# Create docker-compose.override.yml for additional security
cat > docker-compose.override.yml << EOF
version: "3.8"
services:
  postgres:
    read_only: true
    security_opt:
      - no-new-privileges:true
  backend:
    read_only: true
    security_opt:
      - no-new-privileges:true
  nginx-static:
    read_only: true
    security_opt:
      - no-new-privileges:true
EOF
```

## Step 6: Monitoring and Maintenance

### 6.1 Basic Monitoring
```bash
# Create monitoring script
cat > /usr/local/bin/monitor-bosnia.sh << 'EOF'
#!/bin/bash
echo "=== Bosnia Movie Rankings Status ==="
echo "Time: $(date)"
echo ""
echo "Docker Containers:"
docker-compose -f /root/BosniaMovieRankings/docker-compose.proxmox.yml ps
echo ""
echo "Resource Usage:"
docker stats --no-stream
echo ""
echo "Recent Logs:"
docker-compose -f /root/BosniaMovieRankings/docker-compose.proxmox.yml logs --tail=20
EOF

chmod +x /usr/local/bin/monitor-bosnia.sh
```

### 6.2 Automated Backups
```bash
# Create backup script
cat > /usr/local/bin/backup-bosnia.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/bosnia-movie"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_DIR="/root/BosniaMovieRankings"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f $CONTAINER_DIR/docker-compose.proxmox.yml exec -T postgres \
  pg_dump -U movierankings movierankings > $BACKUP_DIR/db_backup_$DATE.sql

# Backup configuration
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
  $CONTAINER_DIR/.env.proxmox \
  $CONTAINER_DIR/docker-compose.proxmox.yml

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql"
echo "Backup completed: $BACKUP_DIR/config_backup_$DATE.tar.gz"
EOF

chmod +x /usr/local/bin/backup-bosnia.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-bosnia.sh") | crontab -
```

### 6.3 Log Rotation
```bash
# Configure Docker log rotation
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

## Step 7: Testing and Verification

### 7.1 Test the Application
1. **Frontend**: https://app.yourdomain.com
2. **API Health**: https://app.yourdomain.com/api/health
3. **Database**: Verify data persistence after restart

### 7.2 Performance Testing
```bash
# Install stress test tool
apt install -y apache2-utils

# Test backend API
ab -n 100 -c 10 https://app.yourdomain.com/api/health

# Test frontend
ab -n 100 -c 10 https://app.yourdomain.com/
```

## Troubleshooting

### Common Issues:

1. **Containers won't start**:
   ```bash
   # Check logs
   docker-compose -f docker-compose.proxmox.yml logs
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

2. **Database connection errors**:
   ```bash
   # Check if PostgreSQL is running
   docker-compose -f docker-compose.proxmox.yml exec postgres pg_isready -U movierankings
   
   # Check logs
   docker-compose -f docker-compose.proxmox.yml logs postgres
   ```

3. **Nginx Proxy Manager can't reach services**:
   ```bash
   # Check firewall
   ufw status
   
   # Test connectivity from NPM container
   # (Run this in NPM container)
   curl http://[LXC IP]:8080
   curl http://[LXC IP]:3001/api/health
   ```

4. **SSL certificate issues**:
   - Ensure port 80 is open for ACME challenge
   - Check DNS propagation
   - Verify domain points to correct IP

### Log Locations:
- **Application logs**: `docker-compose -f docker-compose.proxmox.yml logs [service]`
- **Docker logs**: `/var/lib/docker/containers/`
- **System logs**: `/var/log/syslog`

## Optimization for LXC

### Resource Limits:
```bash
# Set LXC container limits in Proxmox
# CPU: 2-4 cores
# Memory: 2-4 GB
# Disk: 20-40 GB
```

### Performance Tuning:
```bash
# Increase Docker storage driver performance
cat > /etc/docker/daemon.json << EOF
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

## Scaling Considerations

### For Higher Traffic:
1. **Increase LXC resources** in Proxmox
2. **Add backend replicas**:
   ```yaml
   backend:
     deploy:
       replicas: 2
   ```
3. **Use external PostgreSQL** (separate LXC/VM)
4. **Add Redis cache** for sessions

### High Availability:
1. **Multiple LXC containers** behind load balancer
2. **External database cluster**
3. **Object storage** for user uploads

## Maintenance Schedule

### Daily:
- Check logs: `docker-compose -f docker-compose.proxmox.yml logs --tail=50`
- Monitor resources: `docker stats`

### Weekly:
- Update containers: `docker-compose -f docker-compose.proxmox.yml pull`
- Check backups: Verify backup files exist

### Monthly:
- Update LXC container: `apt update && apt upgrade`
- Review security: Check for vulnerabilities
- Test restore from backup

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.proxmox.yml logs`
2. Verify network connectivity
3. Check resource usage
4. Review this deployment guide

For persistent issues, check:
- Docker documentation
- Proxmox forums
- Nginx Proxy Manager documentation

---

**Next Steps:**
1. Set up monitoring (Netdata, Prometheus)
2. Configure automated updates
3. Set up alerting for critical issues
4. Implement CI/CD pipeline for updates

Your Bosnia Movie Rankings application is now deployed and ready for use! 🎬