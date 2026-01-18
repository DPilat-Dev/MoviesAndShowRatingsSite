# Bosnia Movie Rankings - Quick Start Guide

## 🚀 Getting Started

### Option 1: Local Development (Recommended for quick start)

1. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

2. **Start the backend** (in Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:5000`

3. **Start the frontend** (in Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

4. **Open your browser** and go to `http://localhost:3000`

### Option 2: Docker Development

1. **Start all services**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - Database: `localhost:5432`

## 📁 Project Structure

```
bosnia-movie-rankings/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   ├── types/        # TypeScript definitions
│   │   └── styles/       # Tailwind CSS
│   └── package.json
├── backend/               # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, validation
│   │   ├── models/       # Prisma schema
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers
│   ├── prisma/           # Database schema
│   └── package.json
├── docker/               # Docker configurations
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── setup.sh             # Setup script
└── README.md            # Full documentation
```

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
```

### Frontend
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🗄️ Database

### Local Development (SQLite)
- Database file: `backend/dev.db`
- No setup required - created automatically
- Perfect for quick testing

### Docker Development (PostgreSQL)
- Host: `localhost:5432`
- Database: `movierankings`
- User: `movierankings`
- Password: `movierankings123`

### Access Database
```bash
# Using Prisma Studio (web interface)
cd backend
npm run db:studio
# Open http://localhost:5555
```

## 🔐 Authentication

- **No passwords required!** Users login with just a username
- Usernames must be unique
- Optional display name for how users appear in the app
- Session stored in browser localStorage

## 🎯 Key Features Implemented

1. **User Management**
   - Simple username-based login
   - User profiles with display names
   - No sensitive data storage

2. **Movie Management**
   - Add movies with title, year, description
   - Track which year the group watched each movie
   - Browse movie catalog

3. **Ranking System**
   - Rate movies on 1-10 scale
   - Rankings organized by year
   - Update rankings over time

4. **Dashboard & Analytics**
   - Overall rankings view
   - Yearly ranking comparisons
   - User activity tracking
   - Rating distribution charts

5. **Modern UI**
   - Responsive design (mobile-friendly)
   - Dark/light mode support
   - Interactive charts with Recharts
   - Component-based with Shadcn/ui

## 🐳 Docker Commands

```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up

# Stop all containers
docker-compose down

# Rebuild images
docker-compose build

# View logs
docker-compose logs -f
```

## 📊 Sample Data

The database comes pre-seeded with:
- 4 sample users
- 5 sample movies (from 2023-2024)
- Sample rankings for each user
- Yearly ranking data

## 🔄 Data Export/Import

**Export Features** (To be implemented):
- Export rankings as CSV/JSON
- Export by year or user
- Backup entire database

**Import Features** (To be implemented):
- Import from CSV/JSON
- Bulk upload rankings
- Merge data from existing systems

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

### Docker issues
```bash
# Stop and remove all containers
docker-compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# If you see OpenSSL errors, the Dockerfiles have been fixed.
# Rebuilding should resolve the issue.
```

### Database issues
```bash
cd backend
# Reset database
rm dev.db
npm run db:push
npm run db:seed
```

## 📈 Next Steps

1. **Add more features**:
   - Movie poster integration (TMDB API)
   - Comments and reviews
   - Watchlist functionality
   - Group creation and management

2. **Enhance analytics**:
   - Advanced statistics
   - Recommendation engine
   - Year-over-year comparisons

3. **Improve UI/UX**:
   - Movie posters and trailers
   - Social features
   - Mobile app

## 🆘 Need Help?

Check the main `README.md` for detailed documentation or open an issue if you encounter problems.

Happy ranking! 🎬