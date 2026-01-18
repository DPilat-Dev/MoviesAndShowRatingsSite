"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/overall', async (_req, res) => {
    try {
        const [totalMovies, totalUsers, totalRankings] = await Promise.all([
            prisma.movie.count(),
            prisma.user.count(),
            prisma.ranking.count(),
        ]);
        const avgRatingResult = await prisma.ranking.aggregate({
            _avg: { rating: true },
        });
        const years = await prisma.ranking.findMany({
            distinct: ['rankingYear'],
            select: { rankingYear: true },
            orderBy: { rankingYear: 'desc' },
        });
        const yearlyCounts = await Promise.all(years.map(async (yearObj) => {
            const count = await prisma.ranking.count({
                where: { rankingYear: yearObj.rankingYear },
            });
            return {
                year: yearObj.rankingYear,
                count,
            };
        }));
        const ratings = await prisma.ranking.findMany({
            select: { rating: true },
        });
        const distribution = {};
        for (let i = 1; i <= 10; i++) {
            distribution[i] = 0;
        }
        ratings.forEach(r => {
            const rounded = Math.round(r.rating);
            if (rounded >= 1 && rounded <= 10) {
                distribution[rounded]++;
            }
        });
        const ratingDistribution = Object.entries(distribution)
            .map(([rating, count]) => ({
            rating: parseInt(rating),
            count,
        }))
            .sort((a, b) => a.rating - b.rating);
        res.json({
            totalMovies,
            totalUsers,
            totalRankings,
            averageRating: avgRatingResult._avg.rating || 0,
            years: years.map(y => y.rankingYear),
            yearlyCounts,
            ratingDistribution,
        });
    }
    catch (error) {
        console.error('Simple stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});
router.get('/top-movies', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const movies = await prisma.movie.findMany({
            include: {
                rankings: {
                    select: { rating: true },
                },
            },
        });
        const moviesWithStats = movies.map(movie => {
            const ratings = movie.rankings.map(r => r.rating);
            const averageRating = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                : 0;
            return {
                id: movie.id,
                title: movie.title,
                year: movie.year,
                averageRating,
                ratingCount: ratings.length,
            };
        });
        const topMovies = moviesWithStats
            .filter(m => m.ratingCount > 0)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, limit);
        res.json({
            topMovies,
            limit,
        });
    }
    catch (error) {
        console.error('Top movies error:', error);
        res.status(500).json({ error: 'Failed to get top movies' });
    }
});
router.get('/top-users', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { rankings: true },
                },
                rankings: {
                    select: { rating: true },
                },
            },
        });
        const usersWithStats = users.map(user => {
            const ratings = user.rankings.map(r => r.rating);
            const averageRating = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                : 0;
            return {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                rankingCount: user._count.rankings,
                averageRating,
            };
        });
        const topUsers = usersWithStats
            .filter(u => u.rankingCount > 0)
            .sort((a, b) => b.rankingCount - a.rankingCount)
            .slice(0, limit);
        res.json({
            topUsers,
            limit,
        });
    }
    catch (error) {
        console.error('Top users error:', error);
        res.status(500).json({ error: 'Failed to get top users' });
    }
});
exports.default = router;
//# sourceMappingURL=simpleStatsRoutes.js.map