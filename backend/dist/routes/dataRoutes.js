"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/export', async (req, res) => {
    try {
        const query = {
            includeUsers: req.query.includeUsers !== 'false',
            includeMovies: req.query.includeMovies !== 'false',
            includeRankings: req.query.includeRankings !== 'false',
            year: req.query.year ? Number(req.query.year) : undefined,
        };
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            metadata: {
                includeUsers: query.includeUsers,
                includeMovies: query.includeMovies,
                includeRankings: query.includeRankings,
                yearFilter: query.year,
            },
        };
        if (query.includeUsers) {
            data.users = await prisma.user.findMany({
                include: {
                    _count: {
                        select: { rankings: true },
                    },
                },
            });
        }
        if (query.includeMovies) {
            const where = query.year ? { watchedYear: query.year } : {};
            data.movies = await prisma.movie.findMany({
                where,
                include: {
                    _count: {
                        select: { rankings: true },
                    },
                },
            });
        }
        if (query.includeRankings) {
            const where = query.year ? { rankingYear: query.year } : {};
            data.rankings = await prisma.ranking.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, username: true, displayName: true },
                    },
                    movie: {
                        select: { id: true, title: true, year: true },
                    },
                },
                orderBy: [{ rankingYear: 'desc' }, { rating: 'desc' }],
            });
        }
        const filename = `bosnia-movie-rankings-export-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Export error:', errorMessage);
        res.status(400).json({ error: 'Export failed', details: errorMessage });
    }
});
router.post('/import', async (req, res) => {
    try {
        const { data, overwrite = false } = req.body;
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        const results = {
            users: { imported: 0, skipped: 0, errors: [] },
            movies: { imported: 0, skipped: 0, errors: [] },
            rankings: { imported: 0, skipped: 0, errors: [] },
        };
        if (data.users && data.users.length > 0) {
            for (const userData of data.users) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { username: userData.username },
                    });
                    if (existingUser && !overwrite) {
                        results.users.skipped++;
                        continue;
                    }
                    if (existingUser && overwrite) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                displayName: userData.displayName || existingUser.displayName,
                                isActive: userData.isActive !== undefined ? userData.isActive : existingUser.isActive,
                            },
                        });
                    }
                    else {
                        await prisma.user.create({
                            data: {
                                username: userData.username,
                                displayName: userData.displayName || userData.username,
                                isActive: userData.isActive !== undefined ? userData.isActive : true,
                            },
                        });
                    }
                    results.users.imported++;
                }
                catch (error) {
                    results.users.errors.push(`User ${userData.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        if (data.movies && data.movies.length > 0) {
            for (const movieData of data.movies) {
                try {
                    const existingMovie = await prisma.movie.findFirst({
                        where: {
                            title: movieData.title,
                            year: movieData.year,
                        },
                    });
                    if (existingMovie && !overwrite) {
                        results.movies.skipped++;
                        continue;
                    }
                    if (existingMovie && overwrite) {
                        await prisma.movie.update({
                            where: { id: existingMovie.id },
                            data: {
                                description: movieData.description || existingMovie.description,
                                posterUrl: movieData.posterUrl || existingMovie.posterUrl,
                                watchedYear: movieData.watchedYear || existingMovie.watchedYear,
                            },
                        });
                    }
                    else {
                        await prisma.movie.create({
                            data: {
                                title: movieData.title,
                                year: movieData.year,
                                description: movieData.description || '',
                                posterUrl: movieData.posterUrl || '',
                                watchedYear: movieData.watchedYear || movieData.year,
                                addedBy: movieData.addedBy || 'import',
                            },
                        });
                    }
                    results.movies.imported++;
                }
                catch (error) {
                    results.movies.errors.push(`Movie "${movieData.title}" (${movieData.year}): ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        if (data.rankings && data.rankings.length > 0) {
            const users = await prisma.user.findMany();
            const movies = await prisma.movie.findMany();
            const userMap = new Map(users.map(u => [u.username, u.id]));
            const movieMap = new Map(movies.map(m => [`${m.title}|${m.year}`, m.id]));
            for (const rankingData of data.rankings) {
                try {
                    const userId = userMap.get(rankingData.user?.username);
                    const movieId = movieMap.get(`${rankingData.movie?.title}|${rankingData.movie?.year}`);
                    if (!userId || !movieId) {
                        results.rankings.skipped++;
                        results.rankings.errors.push(`Ranking skipped: User or movie not found`);
                        continue;
                    }
                    const existingRanking = await prisma.ranking.findFirst({
                        where: {
                            userId,
                            movieId,
                            rankingYear: rankingData.rankingYear,
                        },
                    });
                    if (existingRanking && !overwrite) {
                        results.rankings.skipped++;
                        continue;
                    }
                    if (existingRanking && overwrite) {
                        await prisma.ranking.update({
                            where: { id: existingRanking.id },
                            data: {
                                rating: rankingData.rating,
                                rankedAt: rankingData.rankedAt ? new Date(rankingData.rankedAt) : new Date(),
                            },
                        });
                    }
                    else {
                        await prisma.ranking.create({
                            data: {
                                userId,
                                movieId,
                                rating: rankingData.rating,
                                rankingYear: rankingData.rankingYear,
                                rankedAt: rankingData.rankedAt ? new Date(rankingData.rankedAt) : new Date(),
                            },
                        });
                    }
                    results.rankings.imported++;
                }
                catch (error) {
                    results.rankings.errors.push(`Ranking error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        res.json({
            message: 'Import completed',
            results,
            summary: {
                totalImported: results.users.imported + results.movies.imported + results.rankings.imported,
                totalSkipped: results.users.skipped + results.movies.skipped + results.rankings.skipped,
                totalErrors: results.users.errors.length + results.movies.errors.length + results.rankings.errors.length,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Import error:', errorMessage);
        res.status(400).json({ error: 'Import failed', details: errorMessage });
    }
});
router.get('/stats', async (_req, res) => {
    try {
        const [userCount, movieCount, rankingCount] = await Promise.all([
            prisma.user.count(),
            prisma.movie.count(),
            prisma.ranking.count(),
        ]);
        const years = await prisma.ranking.groupBy({
            by: ['rankingYear'],
            _count: {
                _all: true,
            },
            orderBy: {
                rankingYear: 'desc',
            },
        });
        res.json({
            counts: {
                users: userCount,
                movies: movieCount,
                rankings: rankingCount,
            },
            years: years.map(year => ({
                year: year.rankingYear,
                count: year._count._all,
            })),
            exportSize: {
                users: userCount * 100,
                movies: movieCount * 200,
                rankings: rankingCount * 150,
                total: userCount * 100 + movieCount * 200 + rankingCount * 150,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Stats error:', errorMessage);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=dataRoutes.js.map