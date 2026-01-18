# Bosnia Movie Rankings

A movie ranking application for groups to track and rank movies they've watched together.

## Features

- **Simple Authentication**: Username-based login (no passwords required)
- **Movie Management**: Add movies with details (title, year, description, poster)
- **Ranking System**: Rate movies on a 1-10 scale
- **Yearly Rankings**: View rankings filtered by year
- **Dashboard**: Overall and individual ranking views
- **Data Export/Import**: Export rankings as CSV/JSON
- **Modern UI**: Responsive design with dark/light mode

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (local dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Containerization**: Docker Compose (optional)

## Development Setup

### Option 1: Local Development (No Docker) - RECOMMENDED

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run db:generate  # Generate Prisma client
   npm run db:push     # Create database schema
   npm run db:seed     # Seed with sample data (optional)
   npm run dev         # Start dev server (port 5000)
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev         # Start dev server (port 3000)
   ```

3. **Access the app**: http://localhost:3000

### Option 2: Docker Development

```bash
# Start all services (development mode with hot reload)
docker-compose -f docker-compose.dev.yml up

# Or for production setup:
# docker-compose up

# Access the app: http://localhost:3000
# API: http://localhost:5000
# Database: localhost:5432
# Prisma Studio: http://localhost:5555 (optional)
```

**Note**: Docker setup requires proper permissions. If you encounter permission issues:
```bash
# Run with sudo if needed
sudo docker-compose -f docker-compose.dev.yml up

# Or add your user to the docker group:
sudo usermod -aG docker $USER
# Then log out and log back in
```

## Environment Variables

Copy `.env.example` to `.env` in both frontend and backend directories:

**Backend (.env)**:
```
DATABASE_URL="file:./dev.db"  # SQLite for local dev
# DATABASE_URL="postgresql://user:password@db:5432/movierankings"  # Docker
PORT=5000
JWT_SECRET=your-secret-key-here
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000
```

## Database Schema

```sql
users(id, username, display_name, created_at, is_active)
movies(id, title, year, description, poster_url, added_by, watched_year, created_at)
rankings(id, user_id, movie_id, rating, ranked_at, updated_at, ranking_year)
```

## API Endpoints

- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/movies` - List movies
- `POST /api/movies` - Add movie
- `GET /api/rankings` - Get rankings
- `POST /api/rankings` - Add/update ranking
- `GET /api/rankings/year/:year` - Yearly rankings
- `GET /api/export` - Export data
- `POST /api/import` - Import data

## Development Scripts

**Backend**:
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

**Frontend**:
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Self-hosted
1. Build frontend: `cd frontend && npm run build`
2. Build backend: `cd backend && npm run build`
3. Set up PostgreSQL database
4. Configure environment variables
5. Start backend: `npm run start`

## 🚨 Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run db:generate
npm run db:push
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

#### OpenSSL/Prisma Error
If you see `Error loading shared library libssl.so.1.1`:
```bash
# The Dockerfiles have been updated to use Debian Bullseye with OpenSSL 1.1.
# Rebuild the images:
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# Or test the fix:
./test-docker-fix.sh
```

#### Permission Denied
```bash
# Run with sudo if needed
sudo docker-compose -f docker-compose.dev.yml up

# Or add your user to the docker group:
sudo usermod -aG docker $USER
# Then log out and log back in
```

#### General Docker Issues
```bash
# Stop and remove all containers
docker-compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Database Issues
```bash
cd backend
# Reset SQLite database
rm -f dev.db
npm run db:push
npm run db:seed

# For Docker/PostgreSQL:
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

### Prisma Issues
```bash
cd backend
# Regenerate Prisma client
npx prisma generate
# Push schema
npx prisma db push
# Open Prisma Studio (web interface)
npx prisma studio
```

## License

MIT