import { Router } from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController'
import { validateQuery, validateBody } from '../middleware/validation'
import { createUserSchema, updateUserSchema, paginationSchema } from '../utils/validation'

const router = Router()

// GET /api/users - Get all users with pagination
router.get('/', validateQuery(paginationSchema), getUsers)

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById)

// POST /api/users - Create new user
router.post('/', validateBody(createUserSchema), createUser)

// PUT /api/users/:id - Update user
router.put('/:id', validateBody(updateUserSchema), updateUser)

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser)

// GET /api/users/:id/stats - Get user statistics and rankings
router.get('/:id/stats', getUserStats)

export default router