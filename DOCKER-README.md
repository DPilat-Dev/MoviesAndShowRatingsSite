# Bosnia Movie Rankings - Docker Setup

This project includes two Docker Compose configurations for development and production environments.

## Development Environment

The development environment includes hot reload for both frontend and backend, and uses bind mounts for live code updates.

### Features:
- **Hot reload** for both frontend (Vite) and backend (TypeScript with tsx)
- **Database** with persistent volume
- **Automatic Prisma client generation**
- **Port mapping**: 
  - Frontend: `3000:3000`
  - Backend: `5000:5000`
  - Database: `5432:5432`

### Usage:
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Rebuild containers
docker-compose -f docker-compose.dev.yml up -d --build

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

### Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: `postgresql://movierankings:movierankings123@localhost:5432/movierankings`

## Production Environment

The production environment uses built/compiled code and is optimized for deployment.

### Features:
- **Built frontend** (served with `serve`)
- **Compiled backend** (TypeScript compiled to JavaScript)
- **Database** with persistent volume
- **Environment variables** for configuration
- **Restart policies** for reliability
- **Port mapping**:
  - Frontend: `3000:3000`
  - Backend: `5000:5000`
  - Database: `5432:5432`

### Usage:
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production environment
docker-compose -f docker-compose.prod.yml down

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### Environment Variables:
Create a `.env` file in the project root or set environment variables:

```bash
# Database
POSTGRES_PASSWORD=your-secure-password

# Backend
JWT_SECRET=your-jwt-secret-key

# Frontend
VITE_API_URL=http://your-domain.com:5000
VITE_OMDB_API_KEY=your-omdb-api-key
VITE_APP_NAME="Your App Name"
VITE_ENABLE_DARK_MODE="true"
```

### Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: `postgresql://movierankings:${POSTGRES_PASSWORD}@localhost:5432/movierankings`

## Database Management

### Development:
```bash
# Run Prisma migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio

# Seed database
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

### Production:
```bash
# Apply database schema
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# Seed database (if needed)
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## Notes

1. **Nginx Proxy Manager**: These configurations don't include nginx since you're using an external Nginx Proxy Manager. Configure it to proxy requests to:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

2. **Data Persistence**: Both configurations use Docker volumes for database persistence:
   - Development: `postgres_data_dev`
   - Production: `postgres_data_prod`

3. **Security**: Change default passwords and secrets in production!

4. **Port Conflicts**: If ports are already in use, modify the port mappings in the docker-compose files.