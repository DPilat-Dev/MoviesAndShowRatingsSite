import { Router } from 'express'
import {
  getRankings,
  getRankingById,
  createRanking,
  updateRanking,
  deleteRanking,
  getRankingsByYear,
  getYearlyStats,
  getUserMovieRanking,
} from '../controllers/rankingController'
import { validateQuery, validateBody } from '../middleware/validation'
import { createRankingSchema, updateRankingSchema, rankingQuerySchema, paginationSchema } from '../utils/validation'

const router = Router()

// GET /api/rankings - Get all rankings with filtering
router.get('/', validateQuery(rankingQuerySchema), validateQuery(paginationSchema), getRankings)

// GET /api/rankings/:id - Get ranking by ID
router.get('/:id', getRankingById)

// POST /api/rankings - Create new ranking
router.post('/', validateBody(createRankingSchema), createRanking)

// PUT /api/rankings/:id - Update ranking
router.put('/:id', validateBody(updateRankingSchema), updateRanking)

// DELETE /api/rankings/:id - Delete ranking
router.delete('/:id', deleteRanking)

// GET /api/rankings/year/:year - Get rankings by year with stats
router.get('/year/:year', getRankingsByYear)

// GET /api/rankings/stats/years - Get yearly statistics
router.get('/stats/years', getYearlyStats)

// GET /api/rankings/user/:userId/movie/:movieId - Get specific user-movie ranking
// GET /api/rankings/user/:userId/movie/:movieId/year/:year - Get specific user-movie-year ranking
router.get('/user/:userId/movie/:movieId', getUserMovieRanking)
router.get('/user/:userId/movie/:movieId/year/:year', getUserMovieRanking)

export default router