import { Router } from 'express'
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieStats,
} from '../controllers/movieController'
import { validateQuery, validateBody } from '../middleware/validation'
import { createMovieSchema, updateMovieSchema, movieQuerySchema, paginationSchema } from '../utils/validation'

const router = Router()

// GET /api/movies - Get all movies with filtering and pagination
router.get('/', validateQuery(movieQuerySchema), validateQuery(paginationSchema), getMovies)

// GET /api/movies/stats - Get movie statistics
router.get('/stats', getMovieStats)

// GET /api/movies/:id - Get movie by ID
router.get('/:id', getMovieById)

// POST /api/movies - Create new movie
router.post('/', validateBody(createMovieSchema), createMovie)

// PUT /api/movies/:id - Update movie
router.put('/:id', validateBody(updateMovieSchema), updateMovie)

// DELETE /api/movies/:id - Delete movie
router.delete('/:id', deleteMovie)

export default router