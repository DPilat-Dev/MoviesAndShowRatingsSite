"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const movieRoutes_1 = __importDefault(require("./routes/movieRoutes"));
const rankingRoutes_1 = __importDefault(require("./routes/rankingRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const tmdbRoutes_1 = __importDefault(require("./routes/tmdbRoutes"));
const statisticsRoutes_1 = __importDefault(require("./routes/statisticsRoutes"));
const simpleStatsRoutes_1 = __importDefault(require("./routes/simpleStatsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://bosniaranking.lonercorp.com',
            'https://apibosniaranking.lonercorp.com'
        ];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const isDevelopment = process.env.NODE_ENV === 'development';
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '10000' : '100')),
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
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
app.use('/api/users', userRoutes_1.default);
app.use('/api/movies', movieRoutes_1.default);
app.use('/api/rankings', rankingRoutes_1.default);
app.use('/api/data', dataRoutes_1.default);
app.use('/api/tmdb', tmdbRoutes_1.default);
app.use('/api/stats', statisticsRoutes_1.default);
app.use('/api/simple-stats', simpleStatsRoutes_1.default);
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
app.use((_req, res) => {
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
//# sourceMappingURL=index.js.map