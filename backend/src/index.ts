import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import rankingRoutes from './routes/rankingRoutes';
import dataRoutes from './routes/dataRoutes';
import tmdbRoutes from './routes/tmdbRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import simpleStatsRoutes from './routes/simpleStatsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '10000' : '100')),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'Bosnia Movie Rankings API',
    version: '1.0.0',
    endpoints: {
      users: {
        base: '/api/users',
        operations: ['GET', 'POST'],
        byId: '/api/users/:id',
        operationsById: ['GET', 'PUT', 'DELETE'],
        stats: '/api/users/:id/stats',
      },
      movies: {
        base: '/api/movies',
        operations: ['GET', 'POST'],
        byId: '/api/movies/:id',
        operationsById: ['GET', 'PUT', 'DELETE'],
        stats: '/api/movies/stats',
      },
       rankings: {
         base: '/api/rankings',
         operations: ['GET', 'POST'],
         byId: '/api/rankings/:id',
         operationsById: ['GET', 'PUT', 'DELETE'],
         byYear: '/api/rankings/year/:year',
         yearlyStats: '/api/rankings/stats/years',
         userMovie: '/api/rankings/user/:userId/movie/:movieId',
         userMovieYear: '/api/rankings/user/:userId/movie/:movieId/year/:year',
       },
       data: {
         export: '/api/data/export',
         import: '/api/data/import',
         stats: '/api/data/stats',
       },
       tmdb: {
         search: '/api/tmdb/search',
         movie: '/api/tmdb/movie/:id',
         match: '/api/tmdb/match',
         import: '/api/tmdb/import',
       },
       stats: {
         overall: '/api/stats/overall',
         year: '/api/stats/year/:year',
         user: '/api/stats/user/:userId',
         movie: '/api/stats/movie/:movieId',
         ratingDistribution: '/api/stats/rating-distribution',
         topMovies: '/api/stats/top-movies',
         topUsers: '/api/stats/top-users',
       },
       health: '/health',
    },
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/stats', statisticsRoutes);
app.use('/api/simple-stats', simpleStatsRoutes);



// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`🎬 Movies API: http://localhost:${PORT}/api/movies`);
  console.log(`⭐ Rankings API: http://localhost:${PORT}/api/rankings`);
});