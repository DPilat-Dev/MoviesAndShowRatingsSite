"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserMovieRanking = exports.getYearlyStats = exports.getRankingsByYear = exports.deleteRanking = exports.updateRanking = exports.createRanking = exports.getRankingById = exports.getRankings = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const prisma = new client_1.PrismaClient();
const getRankings = async (req, res) => {
    try {
        const validatedQuery = validation_1.rankingQuerySchema.parse(req.query);
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (validatedQuery.userId) {
            where.userId = validatedQuery.userId;
        }
        if (validatedQuery.movieId) {
            where.movieId = validatedQuery.movieId;
        }
        if (validatedQuery.rankingYear) {
            where.rankingYear = validatedQuery.rankingYear;
        }
        if (validatedQuery.year) {
            where.rankingYear = validatedQuery.year;
        }
        if (validatedQuery.watchedYear) {
            where.movie = {
                watchedYear: validatedQuery.watchedYear
            };
        }
        const [rankings, total] = await Promise.all([
            prisma.ranking.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { rankedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        },
                    },
                    movie: {
                        select: {
                            id: true,
                            title: true,
                            year: true,
                            watchedYear: true,
                        },
                    },
                },
            }),
            prisma.ranking.count({ where }),
        ]);
        res.json({
            data: rankings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                pages: Math.ceil(Number(total) / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
};
exports.getRankings = getRankings;
const getRankingById = async (req, res) => {
    try {
        const { id } = req.params;
        const ranking = await prisma.ranking.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        watchedYear: true,
                    },
                },
            },
        });
        if (!ranking) {
            return res.status(404).json({ error: 'Ranking not found' });
        }
        res.json(ranking);
    }
    catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({ error: 'Failed to fetch ranking' });
    }
};
exports.getRankingById = getRankingById;
const createRanking = async (req, res) => {
    try {
        const data = req.body;
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const movie = await prisma.movie.findUnique({
            where: { id: data.movieId },
        });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        const existingRanking = await prisma.ranking.findUnique({
            where: {
                userId_movieId_rankingYear: {
                    userId: data.userId,
                    movieId: data.movieId,
                    rankingYear: data.rankingYear,
                },
            },
        });
        if (existingRanking) {
            return res.status(409).json({
                error: 'Ranking already exists for this year',
                existingRanking,
            });
        }
        const ranking = await prisma.ranking.create({
            data: {
                userId: data.userId,
                movieId: data.movieId,
                rating: data.rating,
                rankingYear: data.rankingYear,
                description: data.description,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        watchedYear: true,
                    },
                },
            },
        });
        res.status(201).json(ranking);
    }
    catch (error) {
        console.error('Error creating ranking:', error);
        res.status(500).json({ error: 'Failed to create ranking' });
    }
};
exports.createRanking = createRanking;
const updateRanking = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const ranking = await prisma.ranking.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        watchedYear: true,
                    },
                },
            },
        });
        res.json(ranking);
    }
    catch (error) {
        console.error('Error updating ranking:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return res.status(404).json({ error: 'Ranking not found' });
        }
        res.status(500).json({ error: 'Failed to update ranking' });
    }
};
exports.updateRanking = updateRanking;
const deleteRanking = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.ranking.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting ranking:', error);
        if (error instanceof Error && error.message.includes('Record to delete not found')) {
            return res.status(404).json({ error: 'Ranking not found' });
        }
        res.status(500).json({ error: 'Failed to delete ranking' });
    }
};
exports.deleteRanking = deleteRanking;
const getRankingsByYear = async (req, res) => {
    try {
        const { year } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const ranking_year = parseInt(year);
        const [rankings, total, stats] = await Promise.all([
            prisma.ranking.findMany({
                where: {
                    movie: {
                        watchedYear: ranking_year
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { rankedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        },
                    },
                    movie: {
                        select: {
                            id: true,
                            title: true,
                            year: true,
                            watchedYear: true,
                        },
                    },
                },
            }),
            prisma.ranking.count({
                where: {
                    movie: {
                        watchedYear: ranking_year
                    }
                }
            }),
            prisma.ranking.aggregate({
                where: {
                    movie: {
                        watchedYear: ranking_year
                    }
                },
                _avg: { rating: true },
                _count: true,
                _min: { rating: true },
                _max: { rating: true },
            }),
        ]);
        const topMovies = await prisma.$queryRaw `
      SELECT 
        m.id,
        m.title,
        m.year,
        m.watched_year as watchedYear,
        CAST(AVG(r.rating) AS FLOAT) as averageRating,
        CAST(COUNT(r.id) AS INTEGER) as totalRankings
      FROM movies m
      JOIN rankings r ON m.id = r.movie_id
       WHERE m.watched_year = ${ranking_year}
       GROUP BY m.id, m.title, m.year, m.watched_year
        HAVING COUNT(r.id) >= 1
       ORDER BY AVG(r.rating) DESC
       LIMIT 10
    `;
        const activeUsers = await prisma.$queryRaw `
      SELECT 
        u.id,
        u.username,
        u.display_name as displayName,
        CAST(COUNT(r.id) AS INTEGER) as totalRankings,
        CAST(AVG(r.rating) AS FLOAT) as averageRating
      FROM users u
      JOIN rankings r ON u.id = r.user_id
       JOIN movies m ON r.movie_id = m.id
       WHERE m.watched_year = ${ranking_year}
       GROUP BY u.id, u.username, u.display_name
       ORDER BY COUNT(r.id) DESC
       LIMIT 10
    `;
        const safeTopMovies = Array.isArray(topMovies) ? topMovies.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            watchedYear: movie.watchedyear || movie.watchedYear,
            averageRating: Number(movie.averagerating || movie.averageRating || 0),
            totalRankings: Number(movie.totalrankings || movie.totalRankings || 0),
        })) : [];
        const safeActiveUsers = Array.isArray(activeUsers) ? activeUsers.map(user => ({
            id: user.id,
            username: user.username,
            displayName: user.displayname || user.displayName,
            totalRankings: Number(user.totalrankings || user.totalRankings || 0),
            averageRating: Number(user.averagerating || user.averageRating || 0),
        })) : [];
        res.json({
            year: ranking_year,
            stats: {
                totalRankings: Number(stats._count),
                averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
                minRating: Number(stats._min.rating),
                maxRating: Number(stats._max.rating),
            },
            data: rankings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                pages: Math.ceil(Number(total) / Number(limit)),
            },
            topMovies: safeTopMovies,
            activeUsers: safeActiveUsers,
        });
    }
    catch (error) {
        console.error('Error fetching rankings by year:', error);
        res.status(500).json({ error: 'Failed to fetch rankings by year' });
    }
};
exports.getRankingsByYear = getRankingsByYear;
const getYearlyStats = async (req, res) => {
    try {
        const moviesWithRankings = await prisma.movie.findMany({
            where: {
                rankings: {
                    some: {}
                }
            },
            select: {
                watchedYear: true
            },
            distinct: ['watchedYear']
        });
        const yearlyStatsWithDetails = await Promise.all(moviesWithRankings.map(async (movie) => {
            const watchedYear = movie.watchedYear;
            const rankings = await prisma.ranking.findMany({
                where: {
                    movie: {
                        watchedYear: watchedYear
                    }
                },
                include: {
                    user: true,
                    movie: true
                }
            });
            if (rankings.length === 0) {
                return null;
            }
            const totalRankings = rankings.length;
            const averageRating = rankings.reduce((sum, r) => sum + r.rating, 0) / totalRankings;
            const uniqueUsers = new Set(rankings.map(r => r.userId)).size;
            const uniqueMovies = new Set(rankings.map(r => r.movieId)).size;
            return {
                year: watchedYear,
                totalRankings,
                averageRating: parseFloat(averageRating.toFixed(1)),
                uniqueUsers,
                uniqueMovies,
            };
        }));
        const filteredStats = yearlyStatsWithDetails.filter(stat => stat !== null);
        filteredStats.sort((a, b) => b.year - a.year);
        const years = filteredStats.map(stat => stat.year);
        const minYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
        const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
        res.json({
            yearRange: {
                min: minYear,
                max: maxYear,
            },
            yearlyStats: filteredStats,
        });
    }
    catch (error) {
        console.error('Error fetching yearly stats:', error);
        res.status(500).json({ error: 'Failed to fetch yearly statistics' });
    }
};
exports.getYearlyStats = getYearlyStats;
const getUserMovieRanking = async (req, res) => {
    try {
        const { userId, movieId, year } = req.params;
        const ranking_year = year ? parseInt(year) : new Date().getFullYear();
        const ranking = await prisma.ranking.findUnique({
            where: {
                userId_movieId_rankingYear: {
                    userId,
                    movieId,
                    rankingYear: ranking_year,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        watchedYear: true,
                    },
                },
            },
        });
        if (!ranking) {
            return res.status(404).json({
                error: 'Ranking not found',
                message: `No ranking found for user ${userId}, movie ${movieId}, year ${ranking_year}`,
            });
        }
        res.json(ranking);
    }
    catch (error) {
        console.error('Error fetching user movie ranking:', error);
        res.status(500).json({ error: 'Failed to fetch ranking' });
    }
};
exports.getUserMovieRanking = getUserMovieRanking;
//# sourceMappingURL=rankingController.js.map