"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMovieMetadata = exports.getUnratedMovies = exports.getMovieStats = exports.deleteMovie = exports.updateMovie = exports.createMovie = exports.getMovieById = exports.getMovies = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const prisma = new client_1.PrismaClient();
const getMovies = async (req, res) => {
    try {
        const validatedQuery = validation_1.movieQuerySchema.parse(req.query);
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (validatedQuery.year) {
            where.year = validatedQuery.year;
        }
        if (validatedQuery.watchedYear) {
            where.watchedYear = validatedQuery.watchedYear;
        }
        if (validatedQuery.search) {
            where.OR = [
                { title: { contains: validatedQuery.search, mode: 'insensitive' } },
                { description: { contains: validatedQuery.search, mode: 'insensitive' } },
            ];
        }
        const orderBy = {};
        orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;
        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy,
                select: {
                    id: true,
                    title: true,
                    year: true,
                    description: true,
                    posterUrl: true,
                    watchedYear: true,
                    addedBy: true,
                    createdAt: true,
                    _count: {
                        select: {
                            rankings: true,
                        },
                    },
                    rankings: {
                        select: {
                            rating: true,
                        },
                    },
                },
            }),
            prisma.movie.count({ where }),
        ]);
        const moviesWithStats = movies.map(movie => {
            const avgRating = movie.rankings.length > 0
                ? movie.rankings.reduce((sum, r) => sum + r.rating, 0) / movie.rankings.length
                : 0;
            return {
                ...movie,
                averageRating: parseFloat(avgRating.toFixed(1)),
                totalRankings: movie._count.rankings,
            };
        });
        return res.json({
            data: moviesWithStats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                pages: Math.ceil(Number(total) / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching movies:', error);
        return res.status(500).json({ error: 'Failed to fetch movies' });
    }
};
exports.getMovies = getMovies;
const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await prisma.movie.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                year: true,
                description: true,
                posterUrl: true,
                watchedYear: true,
                addedBy: true,
                createdAt: true,
                rankings: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                            },
                        },
                    },
                    orderBy: { rankedAt: 'desc' },
                },
                _count: {
                    select: {
                        rankings: true,
                    },
                },
            },
        });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        const avgRating = movie.rankings.length > 0
            ? movie.rankings.reduce((sum, r) => sum + r.rating, 0) / movie.rankings.length
            : 0;
        const rankingsByYear = movie.rankings.reduce((acc, ranking) => {
            const year = ranking.rankingYear;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(ranking);
            return acc;
        }, {});
        const yearlyStats = Object.entries(rankingsByYear).map(([year, yearRankings]) => {
            const yearAvgRating = yearRankings.reduce((sum, r) => sum + r.rating, 0) / yearRankings.length;
            return {
                year: parseInt(year),
                count: yearRankings.length,
                averageRating: parseFloat(yearAvgRating.toFixed(1)),
            };
        });
        const movieWithStats = {
            ...movie,
            averageRating: parseFloat(avgRating.toFixed(1)),
            totalRankings: movie._count.rankings,
            yearlyStats: yearlyStats.sort((a, b) => b.year - a.year),
        };
        return res.json(movieWithStats);
    }
    catch (error) {
        console.error('Error fetching movie:', error);
        return res.status(500).json({ error: 'Failed to fetch movie' });
    }
};
exports.getMovieById = getMovieById;
const createMovie = async (req, res) => {
    try {
        const data = req.body;
        const existingMovie = await prisma.movie.findFirst({
            where: {
                title: { equals: data.title, mode: 'insensitive' },
                year: data.year,
            },
        });
        if (existingMovie) {
            return res.status(409).json({
                error: 'Movie already exists',
                existingMovie,
            });
        }
        const movie = await prisma.movie.create({
            data: {
                title: data.title,
                year: data.year,
                description: data.description,
                posterUrl: data.posterUrl,
                watchedYear: data.watchedYear,
                addedBy: data.addedBy,
            },
            select: {
                id: true,
                title: true,
                year: true,
                description: true,
                posterUrl: true,
                watchedYear: true,
                addedBy: true,
                createdAt: true,
            },
        });
        return res.status(201).json(movie);
    }
    catch (error) {
        console.error('Error creating movie:', error);
        return res.status(500).json({ error: 'Failed to create movie' });
    }
};
exports.createMovie = createMovie;
const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const movie = await prisma.movie.update({
            where: { id },
            data,
            select: {
                id: true,
                title: true,
                year: true,
                description: true,
                posterUrl: true,
                watchedYear: true,
                addedBy: true,
                createdAt: true,
            },
        });
        return res.json(movie);
    }
    catch (error) {
        console.error('Error updating movie:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        return res.status(500).json({ error: 'Failed to update movie' });
    }
};
exports.updateMovie = updateMovie;
const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const rankingsCount = await prisma.ranking.count({
            where: { movieId: id },
        });
        if (rankingsCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete movie with rankings',
                message: 'Movie has existing rankings. Consider archiving instead.'
            });
        }
        await prisma.movie.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting movie:', error);
        if (error instanceof Error && error.message.includes('Record to delete not found')) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        return res.status(500).json({ error: 'Failed to delete movie' });
    }
};
exports.deleteMovie = deleteMovie;
const getMovieStats = async (_req, res) => {
    try {
        const [aggregateStats, yearlyCounts, ratingStats] = await Promise.all([
            prisma.movie.aggregate({
                _count: {
                    id: true,
                },
                _avg: {
                    watchedYear: true,
                },
                _min: {
                    watchedYear: true,
                },
                _max: {
                    watchedYear: true,
                },
            }),
            prisma.movie.groupBy({
                by: ['watchedYear'],
                _count: {
                    id: true,
                },
                orderBy: {
                    watchedYear: 'desc',
                },
            }),
            prisma.ranking.groupBy({
                by: ['movieId'],
                _avg: {
                    rating: true,
                },
                having: {
                    movieId: {
                        _count: {
                            gt: 0,
                        },
                    },
                },
            }),
        ]);
        const watchedYearsGroup = await prisma.movie.groupBy({
            by: ['watchedYear'],
            _count: {
                id: true,
            },
        });
        const uniqueWatchedYears = watchedYearsGroup.length;
        const averageRating = ratingStats.length > 0
            ? ratingStats.reduce((sum, stat) => sum + (stat._avg.rating || 0), 0) / ratingStats.length
            : 0;
        return res.json({
            overall: {
                totalMovies: aggregateStats._count.id,
                averageWatchedYear: aggregateStats._avg.watchedYear ? aggregateStats._avg.watchedYear.toFixed(0) : "0",
                oldestWatchedYear: aggregateStats._min.watchedYear || 0,
                newestWatchedYear: aggregateStats._max.watchedYear || 0,
                uniqueWatchedYears: uniqueWatchedYears,
                averageRating: parseFloat(averageRating.toFixed(1)),
            },
            byWatchedYear: yearlyCounts.map(item => ({
                year: item.watchedYear,
                count: item._count.id,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching movie stats:', error);
        return res.status(500).json({ error: 'Failed to fetch movie statistics' });
    }
};
exports.getMovieStats = getMovieStats;
const getUnratedMovies = async (req, res) => {
    try {
        const { year } = req.params;
        const userId = req.headers['x-user-id'];
        if (!year) {
            return res.status(400).json({ error: 'Year parameter is required' });
        }
        const watchedYear = parseInt(year);
        const allMovies = await prisma.movie.findMany({
            where: { watchedYear },
            select: {
                id: true,
                title: true,
                year: true,
                posterUrl: true,
                watchedYear: true,
            },
            orderBy: { title: 'asc' },
        });
        if (userId) {
            const userRankings = await prisma.ranking.findMany({
                where: {
                    userId,
                },
                select: { movieId: true },
            });
            const ratedMovieIds = new Set(userRankings.map(r => r.movieId));
            const unratedMovies = allMovies.filter(movie => !ratedMovieIds.has(movie.id));
            return res.json({
                year: watchedYear,
                totalMovies: allMovies.length,
                unratedCount: unratedMovies.length,
                movies: unratedMovies,
            });
        }
        return res.json({
            year: watchedYear,
            totalMovies: allMovies.length,
            unratedCount: allMovies.length,
            movies: allMovies,
        });
    }
    catch (error) {
        console.error('Error fetching unrated movies:', error);
        return res.status(500).json({ error: 'Failed to fetch unrated movies' });
    }
};
exports.getUnratedMovies = getUnratedMovies;
const updateMovieMetadata = async (req, res) => {
    try {
        const { movieIds, metadata } = req.body;
        const BATCH_SIZE = 10;
        const results = [];
        const errors = [];
        for (let i = 0; i < movieIds.length; i += BATCH_SIZE) {
            const batch = movieIds.slice(i, i + BATCH_SIZE);
            try {
                const updateResult = await prisma.movie.updateMany({
                    where: {
                        id: {
                            in: batch
                        }
                    },
                    data: metadata
                });
                results.push({
                    batch: batch,
                    updatedCount: updateResult.count
                });
                if (i + BATCH_SIZE < movieIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                console.error(`Error updating batch ${i / BATCH_SIZE + 1}:`, error);
                errors.push({
                    batch: batch,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return res.json({
            success: true,
            totalMovies: movieIds.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            message: `Updated metadata for ${movieIds.length} movies`
        });
    }
    catch (error) {
        console.error('Error updating movie metadata:', error);
        return res.status(500).json({ error: 'Failed to update movie metadata' });
    }
};
exports.updateMovieMetadata = updateMovieMetadata;
//# sourceMappingURL=movieController.js.map