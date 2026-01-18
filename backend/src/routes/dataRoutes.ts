import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();



/**
 * @route GET /api/data/export
 * @desc Export all data as JSON
 * @access Public
 */
router.get('/export', async (req, res) => {
  try {
    // Parse query parameters manually since they come as strings
    const query = {
      includeUsers: req.query.includeUsers !== 'false',
      includeMovies: req.query.includeMovies !== 'false',
      includeRankings: req.query.includeRankings !== 'false',
      year: req.query.year ? Number(req.query.year) : undefined,
    };
    
    const data: any = {
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

    // Set headers for file download
    const filename = `bosnia-movie-rankings-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    
    res.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Export error:', errorMessage);
    res.status(400).json({ error: 'Export failed', details: errorMessage });
  }
});

/**
 * @route POST /api/data/import
 * @desc Import data from JSON
 * @access Public
 */
router.post('/import', async (req, res) => {
  try {
    const { data, overwrite = false } = req.body;
    
    // Basic validation
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const results = {
      users: { imported: 0, skipped: 0, errors: [] as string[] },
      movies: { imported: 0, skipped: 0, errors: [] as string[] },
      rankings: { imported: 0, skipped: 0, errors: [] as string[] },
    };

    // Import users
    if (data.users && data.users.length > 0) {
      for (const userData of data.users) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { username: userData.username },
          });

          if (existingUser && !overwrite) {
            results.users.skipped++;
            continue;
          }

          if (existingUser && overwrite) {
            // Update existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                displayName: userData.displayName || existingUser.displayName,
                isActive: userData.isActive !== undefined ? userData.isActive : existingUser.isActive,
              },
            });
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                username: userData.username,
                displayName: userData.displayName || userData.username,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
              },
            });
          }
          results.users.imported++;
        } catch (error) {
          results.users.errors.push(`User ${userData.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import movies
    if (data.movies && data.movies.length > 0) {
      for (const movieData of data.movies) {
        try {
          // Check if movie already exists (by title and year)
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
            // Update existing movie
            await prisma.movie.update({
              where: { id: existingMovie.id },
              data: {
                description: movieData.description || existingMovie.description,
                posterUrl: movieData.posterUrl || existingMovie.posterUrl,
                watchedYear: movieData.watchedYear || existingMovie.watchedYear,
              },
            });
          } else {
            // Create new movie
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
        } catch (error) {
          results.movies.errors.push(`Movie "${movieData.title}" (${movieData.year}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import rankings (requires users and movies to exist)
    if (data.rankings && data.rankings.length > 0) {
      // Get all users and movies for mapping
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

          // Check if ranking already exists
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
            // Update existing ranking
            await prisma.ranking.update({
              where: { id: existingRanking.id },
              data: {
                rating: rankingData.rating,
                rankedAt: rankingData.rankedAt ? new Date(rankingData.rankedAt) : new Date(),
              },
            });
          } else {
            // Create new ranking
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
        } catch (error) {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Import error:', errorMessage);
    res.status(400).json({ error: 'Import failed', details: errorMessage });
  }
});

/**
 * @route GET /api/data/stats
 * @desc Get data statistics
 * @access Public
 */
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
        users: userCount * 100, // Approximate bytes per user
        movies: movieCount * 200, // Approximate bytes per movie
        rankings: rankingCount * 150, // Approximate bytes per ranking
        total: userCount * 100 + movieCount * 200 + rankingCount * 150,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Stats error:', errorMessage);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;