import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    displayName?: string | undefined;
}, {
    username: string;
    displayName?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
    isActive?: boolean | undefined;
}, {
    username?: string | undefined;
    displayName?: string | undefined;
    avatarUrl?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const createMovieSchema: z.ZodObject<{
    title: z.ZodString;
    year: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    posterUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    watchedYear: z.ZodNumber;
    addedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    year: number;
    watchedYear: number;
    addedBy: string;
    description?: string | undefined;
    posterUrl?: string | undefined;
}, {
    title: string;
    year: number;
    watchedYear: number;
    addedBy: string;
    description?: string | undefined;
    posterUrl?: string | undefined;
}>;
export declare const updateMovieSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    posterUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    watchedYear: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    year?: number | undefined;
    description?: string | undefined;
    posterUrl?: string | undefined;
    watchedYear?: number | undefined;
}, {
    title?: string | undefined;
    year?: number | undefined;
    description?: string | undefined;
    posterUrl?: string | undefined;
    watchedYear?: number | undefined;
}>;
export declare const bulkUpdateMovieSchema: z.ZodObject<{
    movieIds: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodEffects<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        posterUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        year: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    }, {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    }>, {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    }, {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    movieIds: string[];
    metadata: {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    };
}, {
    movieIds: string[];
    metadata: {
        year?: number | undefined;
        description?: string | undefined;
        posterUrl?: string | undefined;
    };
}>;
export declare const createRankingSchema: z.ZodObject<{
    userId: z.ZodString;
    movieId: z.ZodString;
    rating: z.ZodNumber;
    rankingYear: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    movieId: string;
    rating: number;
    rankingYear: number;
    description?: string | undefined;
}, {
    userId: string;
    movieId: string;
    rating: number;
    rankingYear: number;
    description?: string | undefined;
}>;
export declare const updateRankingSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    rankingYear: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    rating?: number | undefined;
    rankingYear?: number | undefined;
}, {
    description?: string | undefined;
    rating?: number | undefined;
    rankingYear?: number | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const movieQuerySchema: z.ZodObject<{
    year: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
    watchedYear: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["title", "year", "watchedYear", "createdAt"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sortBy: "title" | "year" | "watchedYear" | "createdAt";
    sortOrder: "asc" | "desc";
    year?: number | undefined;
    watchedYear?: number | undefined;
    search?: string | undefined;
}, {
    year?: string | undefined;
    watchedYear?: string | undefined;
    search?: string | undefined;
    sortBy?: "title" | "year" | "watchedYear" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const rankingQuerySchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    movieId: z.ZodOptional<z.ZodString>;
    rankingYear: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
    year: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
    watchedYear: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    year?: number | undefined;
    watchedYear?: number | undefined;
    userId?: string | undefined;
    movieId?: string | undefined;
    rankingYear?: number | undefined;
}, {
    year?: string | undefined;
    watchedYear?: string | undefined;
    userId?: string | undefined;
    movieId?: string | undefined;
    rankingYear?: string | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type BulkUpdateMovieInput = z.infer<typeof bulkUpdateMovieSchema>;
export type CreateRankingInput = z.infer<typeof createRankingSchema>;
export type UpdateRankingInput = z.infer<typeof updateRankingSchema>;
export type MovieQueryInput = z.infer<typeof movieQuerySchema>;
export type RankingQueryInput = z.infer<typeof rankingQuerySchema>;
//# sourceMappingURL=validation.d.ts.map