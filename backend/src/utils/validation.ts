import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1).max(100).optional(),
})

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  displayName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
})

// Movie validation schemas
export const createMovieSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 5),
  description: z.string().max(1000).optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  watchedYear: z.number().int().min(2000).max(new Date().getFullYear()),
  addedBy: z.string().min(1),
})

export const updateMovieSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
  description: z.string().max(1000).optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  watchedYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
})

// Ranking validation schemas
export const createRankingSchema = z.object({
  userId: z.string().min(1),
  movieId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  rankingYear: z.number().int().min(2000).max(new Date().getFullYear()),
  description: z.string().max(500).optional(),
})

export const updateRankingSchema = z.object({
  rating: z.number().int().min(1).max(10).optional(),
  rankingYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  description: z.string().max(500).optional(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
})

export const movieQuerySchema = z.object({
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  watchedYear: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'year', 'watchedYear', 'createdAt']).optional().default('title'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const rankingQuerySchema = z.object({
  userId: z.string().optional(),
  movieId: z.string().optional(),
  rankingYear: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  watchedYear: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
})

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateMovieInput = z.infer<typeof createMovieSchema>
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>
export type CreateRankingInput = z.infer<typeof createRankingSchema>
export type UpdateRankingInput = z.infer<typeof updateRankingSchema>
export type MovieQueryInput = z.infer<typeof movieQuerySchema>
export type RankingQueryInput = z.infer<typeof rankingQuerySchema>