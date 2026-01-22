"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statisticsService_1 = __importDefault(require("../services/statisticsService"));
const router = (0, express_1.Router)();
const statisticsService = new statisticsService_1.default();
router.get('/overall', async (_req, res) => {
    try {
        const stats = await statisticsService.getOverallStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Overall stats error:', error);
        res.status(500).json({ error: 'Failed to get overall statistics' });
    }
});
router.get('/year/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        if (isNaN(year)) {
            return res.status(400).json({ error: 'Invalid year' });
        }
        const stats = await statisticsService.getYearlyStats(year);
        return res.json(stats);
    }
    catch (error) {
        console.error('Yearly stats error:', error);
        return res.status(500).json({ error: 'Failed to get yearly statistics' });
    }
});
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await statisticsService.getUserStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            error: 'Failed to get user statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/movie/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const stats = await statisticsService.getMovieStats(movieId);
        res.json(stats);
    }
    catch (error) {
        console.error('Movie stats error:', error);
        res.status(500).json({
            error: 'Failed to get movie statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/rating-distribution', async (_req, res) => {
    try {
        const stats = await statisticsService.getOverallStats();
        res.json({
            distribution: stats.ratingDistribution,
            total: stats.totalRankings,
            average: stats.averageRating,
        });
    }
    catch (error) {
        console.error('Rating distribution error:', error);
        res.status(500).json({ error: 'Failed to get rating distribution' });
    }
});
router.get('/top-movies', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const topMovies = await statisticsService.getOverallStats();
        return res.json({
            topMovies: topMovies.yearlyStats.flatMap(yearStats => yearStats.topMovies)
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, limit),
            limit,
            yearFilter: year,
        });
    }
    catch (error) {
        console.error('Top movies error:', error);
        return res.status(500).json({ error: 'Failed to get top movies' });
    }
});
router.get('/top-users', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const stats = await statisticsService.getOverallStats();
        const userMap = new Map();
        stats.yearlyStats.forEach(yearStats => {
            yearStats.topUsers.forEach(user => {
                if (userMap.has(user.id)) {
                    const existing = userMap.get(user.id);
                    existing.rankingCount += user.rankingCount;
                }
                else {
                    userMap.set(user.id, { ...user });
                }
            });
        });
        const topUsers = Array.from(userMap.values())
            .sort((a, b) => b.rankingCount - a.rankingCount)
            .slice(0, limit);
        res.json({
            topUsers,
            limit,
            yearFilter: year,
        });
    }
    catch (error) {
        console.error('Top users error:', error);
        res.status(500).json({ error: 'Failed to get top users' });
    }
});
exports.default = router;
//# sourceMappingURL=statisticsRoutes.js.map