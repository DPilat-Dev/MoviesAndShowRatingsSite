import { Router } from 'express';
import StatisticsService from '../services/statisticsService';

const router = Router();
const statisticsService = new StatisticsService();

/**
 * @route GET /api/stats/overall
 * @desc Get overall statistics
 * @access Public
 */
router.get('/overall', async (_req, res) => {
  try {
    const stats = await statisticsService.getOverallStats();
    res.json(stats);
  } catch (error) {
    console.error('Overall stats error:', error);
    res.status(500).json({ error: 'Failed to get overall statistics' });
  }
});

/**
 * @route GET /api/stats/year/:year
 * @desc Get yearly statistics
 * @access Public
 */
router.get('/year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    
    const stats = await statisticsService.getYearlyStats(year);
    return res.json(stats);
  } catch (error) {
    console.error('Yearly stats error:', error);
    return res.status(500).json({ error: 'Failed to get yearly statistics' });
  }
});

/**
 * @route GET /api/stats/user/:userId
 * @desc Get user statistics
 * @access Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await statisticsService.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get user statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/stats/movie/:movieId
 * @desc Get movie statistics
 * @access Public
 */
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const stats = await statisticsService.getMovieStats(movieId);
    res.json(stats);
  } catch (error) {
    console.error('Movie stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get movie statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/stats/rating-distribution
 * @desc Get rating distribution
 * @access Public
 */
router.get('/rating-distribution', async (_req, res) => {
  try {
    const stats = await statisticsService.getOverallStats();
    res.json({
      distribution: stats.ratingDistribution,
      total: stats.totalRankings,
      average: stats.averageRating,
    });
  } catch (error) {
    console.error('Rating distribution error:', error);
    res.status(500).json({ error: 'Failed to get rating distribution' });
  }
});

/**
 * @route GET /api/stats/top-movies
 * @desc Get top movies by average rating
 * @access Public
 */
router.get('/top-movies', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const topMovies = await statisticsService.getOverallStats();
    
    // For now, return top movies from current data
    // In a real implementation, you would query the database directly
    return res.json({
      topMovies: topMovies.yearlyStats.flatMap(yearStats => yearStats.topMovies)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, limit),
      limit,
      yearFilter: year,
    });
  } catch (error) {
    console.error('Top movies error:', error);
    return res.status(500).json({ error: 'Failed to get top movies' });
  }
});

/**
 * @route GET /api/stats/top-users
 * @desc Get top users by number of rankings
 * @access Public
 */
router.get('/top-users', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const stats = await statisticsService.getOverallStats();
    
    // Combine top users from all years
    const userMap = new Map();
    stats.yearlyStats.forEach(yearStats => {
      yearStats.topUsers.forEach(user => {
        if (userMap.has(user.id)) {
          const existing = userMap.get(user.id);
          existing.rankingCount += user.rankingCount;
        } else {
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
  } catch (error) {
    console.error('Top users error:', error);
    res.status(500).json({ error: 'Failed to get top users' });
  }
});

export default router;