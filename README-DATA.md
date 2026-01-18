# Bosnia Movie Rankings - Data Management

## Current Status

✅ **Fixed Issues:**
1. **Axios dependency** - Fixed by rebuilding Docker container with proper dependencies
2. **Database connection** - Updated from SQLite to PostgreSQL in Docker setup
3. **Proxy configuration** - Fixed frontend proxy to connect to backend container
4. **Prisma schema** - Updated for PostgreSQL compatibility
5. **Seed data** - Database seeded with sample users, movies, and rankings

## Data Export/Import

### Export Current Data
```bash
# Using the provided script
./export-data.sh

# Or manually via API
curl "http://localhost:5000/api/data/export?includeUsers=true&includeMovies=true&includeRankings=true" \
  -o "export-$(date +%Y-%m-%d).json"
```

### Import Data
```bash
# Using the API (replace with your file)
curl -X POST "http://localhost:5000/api/data/import" \
  -H "Content-Type: application/json" \
  -d '{"data": YOUR_JSON_DATA, "overwrite": false}'
```

### Preserved Seed Data
The original seed data has been saved as `backend/seed-data.json`. This can be:
1. Used to restore initial state
2. Imported via the API import endpoint
3. Modified and reused for testing

## Docker Setup

### Running the Application
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Or in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Database Operations
```bash
# Push schema to database
docker-compose -f docker-compose.dev.yml exec backend npm run db:push

# Seed database with sample data
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed

# Open Prisma Studio (database GUI)
docker-compose -f docker-compose.dev.yml exec backend npm run db:studio
```

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /api` - API documentation

### Data Management
- `GET /api/data/export` - Export all data as JSON
- `POST /api/data/import` - Import data from JSON
- `GET /api/data/stats` - Get data statistics

### Core Resources
- `GET /api/users` - List users
- `GET /api/movies` - List movies  
- `GET /api/rankings` - List rankings

## Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **Database**: PostgreSQL on localhost:5432

## Next Steps

1. **Add movies/users via frontend** - The UI should now work with the live backend
2. **Customize seed data** - Modify `backend/seed-data.json` with your actual movie rankings
3. **Backup regularly** - Use the export script before making major changes
4. **User authentication** - Consider adding login functionality if needed