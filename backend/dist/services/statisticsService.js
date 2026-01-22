"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class StatisticsService {
    async getOverallStats() {
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
        const yearlyStatsPromises = years.map(yearObj => this.getYearlyStats(yearObj.rankingYear));
        const yearlyStats = await Promise.all(yearlyStatsPromises);
        const ratingDistribution = await this.getRatingDistribution();
        const genreDistribution = [];
        return {
            totalMovies,
            totalUsers,
            totalRankings,
            averageRating: avgRatingResult._avg.rating || 0,
            years: years.map(y => y.rankingYear),
            yearlyStats,
            genreDistribution,
            ratingDistribution,
        };
    }
    async getYearlyStats(year) {
        const [movieCount, rankingCount, userCount] = await Promise.all([
            prisma.movie.count({ where: { watchedYear: year } }),
            prisma.ranking.count({ where: { rankingYear: year } }),
            prisma.user.count({
                where: {
                    rankings: {
                        some: { rankingYear: year },
                    },
                },
            }),
        ]);
        const avgRatingResult = await prisma.ranking.aggregate({
            where: { rankingYear: year },
            _avg: { rating: true },
        });
        const topMovies = await prisma.ranking.groupBy({
            by: ['movieId'],
            where: { rankingYear: year },
            _avg: { rating: true },
            _count: true,
            orderBy: { _avg: { rating: 'desc' } },
            take: 10,
        });
        const topMoviesWithDetails = await Promise.all(topMovies.map(async (movie) => {
            const movieDetails = await prisma.movie.findUnique({
                where: { id: movie.movieId },
                select: { title: true, year: true, posterUrl: true },
            });
            return {
                id: movie.movieId,
                title: movieDetails?.title || 'Unknown',
                year: movieDetails?.year || 0,
                posterUrl: movieDetails?.posterUrl || null,
                averageRating: movie._avg.rating || 0,
                rankingCount: movie._count,
            };
        }));
        const topUsers = await prisma.ranking.groupBy({
            by: ['userId'],
            where: { rankingYear: year },
            _count: true,
            _avg: { rating: true },
        });
        topUsers.sort((a, b) => b._count - a._count);
        const top10Users = topUsers.slice(0, 10);
        const topUsersWithDetails = await Promise.all(top10Users.map(async (user) => {
            const userDetails = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { username: true, displayName: true },
            });
            return {
                id: user.userId,
                username: userDetails?.username || 'Unknown',
                displayName: userDetails?.displayName || 'Unknown',
                rankingCount: user._count,
                averageRating: user._avg?.rating || 0,
            };
        }));
        return {
            year,
            movieCount,
            rankingCount,
            userCount,
            averageRating: avgRatingResult._avg.rating || 0,
            topMovies: topMoviesWithDetails,
            topUsers: topUsersWithDetails,
        };
    }
    async getUserStats(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, displayName: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const rankings = await prisma.ranking.findMany({
            where: { userId },
            include: {
                movie: {
                    select: { title: true, year: true },
                },
            },
            orderBy: [{ rankingYear: 'desc' }, { rating: 'desc' }],
        });
        const totalRankings = rankings.length;
        const averageRating = rankings.length > 0
            ? rankings.reduce((sum, r) => sum + r.rating, 0) / rankings.length
            : 0;
        const yearsActive = [...new Set(rankings.map(r => r.rankingYear))].sort((a, b) => b - a);
        const topMovies = rankings
            .slice(0, 10)
            .map(r => ({
            movieId: r.movieId,
            title: r.movie.title,
            year: r.movie.year,
            rating: r.rating,
            rankingYear: r.rankingYear,
        }));
        const ratingDistribution = this.calculateRatingDistribution(rankings.map(r => r.rating));
        return {
            userId,
            username: user.username,
            displayName: user.displayName,
            totalRankings,
            averageRating,
            yearsActive,
            topMovies,
            ratingDistribution,
        };
    }
    async getMovieStats(movieId) {
        const movie = await prisma.movie.findUnique({
            where: { id: movieId },
            select: { title: true, year: true },
        });
        if (!movie) {
            throw new Error('Movie not found');
        }
        const rankings = await prisma.ranking.findMany({
            where: { movieId },
            include: {
                user: {
                    select: { username: true, displayName: true },
                },
            },
            orderBy: [{ rankingYear: 'desc' }, { rating: 'desc' }],
        });
        const totalRankings = rankings.length;
        const averageRating = rankings.length > 0
            ? rankings.reduce((sum, r) => sum + r.rating, 0) / rankings.length
            : 0;
        const ratingDistribution = this.calculateRatingDistribution(rankings.map(r => r.rating));
        const yearlyStatsMap = new Map();
        rankings.forEach(r => {
            const yearStats = yearlyStatsMap.get(r.rankingYear) || { total: 0, sum: 0 };
            yearStats.total += 1;
            yearStats.sum += r.rating;
            yearlyStatsMap.set(r.rankingYear, yearStats);
        });
        const yearlyStats = Array.from(yearlyStatsMap.entries())
            .map(([year, stats]) => ({
            year,
            averageRating: stats.total > 0 ? stats.sum / stats.total : 0,
            rankingCount: stats.total,
        }))
            .sort((a, b) => b.year - a.year);
        const userRankings = rankings.map(r => ({
            userId: r.userId,
            username: r.user.username,
            displayName: r.user.displayName,
            rating: r.rating,
            rankingYear: r.rankingYear,
        }));
        return {
            movieId,
            title: movie.title,
            year: movie.year,
            totalRankings,
            averageRating,
            ratingDistribution,
            yearlyStats,
            userRankings,
        };
    }
    async getRatingDistribution() {
        const ratings = await prisma.ranking.findMany({
            select: { rating: true },
        });
        return this.calculateRatingDistribution(ratings.map(r => r.rating));
    }
    calculateRatingDistribution(ratings) {
        const distribution = {};
        for (let i = 1; i <= 10; i++) {
            distribution[i] = 0;
        }
        ratings.forEach(rating => {
            const rounded = Math.round(rating);
            if (rounded >= 1 && rounded <= 10) {
                distribution[rounded]++;
            }
        });
        return Object.entries(distribution)
            .map(([rating, count]) => ({
            rating: parseInt(rating),
            count,
        }))
            .sort((a, b) => a.rating - b.rating);
    }
}
exports.default = StatisticsService;
//# sourceMappingURL=statisticsService.js.map