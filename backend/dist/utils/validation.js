"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankingQuerySchema = exports.movieQuerySchema = exports.paginationSchema = exports.updateRankingSchema = exports.createRankingSchema = exports.updateMovieSchema = exports.createMovieSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    displayName: zod_1.z.string().min(1).max(100).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createMovieSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    year: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 5),
    description: zod_1.z.string().max(1000).optional(),
    posterUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    watchedYear: zod_1.z.number().int().min(2000).max(new Date().getFullYear()),
    addedBy: zod_1.z.string().min(1),
});
exports.updateMovieSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    year: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
    description: zod_1.z.string().max(1000).optional(),
    posterUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    watchedYear: zod_1.z.number().int().min(2000).max(new Date().getFullYear()).optional(),
});
exports.createRankingSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    movieId: zod_1.z.string().min(1),
    rating: zod_1.z.number().int().min(1).max(10),
    rankingYear: zod_1.z.number().int().min(2000).max(new Date().getFullYear()),
    description: zod_1.z.string().max(500).optional(),
});
exports.updateRankingSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(10).optional(),
    rankingYear: zod_1.z.number().int().min(2000).max(new Date().getFullYear()).optional(),
    description: zod_1.z.string().max(500).optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});
exports.movieQuerySchema = zod_1.z.object({
    year: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    watchedYear: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['title', 'year', 'watchedYear', 'createdAt']).optional().default('title'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
exports.rankingQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    movieId: zod_1.z.string().optional(),
    rankingYear: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    year: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    watchedYear: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});
//# sourceMappingURL=validation.js.map