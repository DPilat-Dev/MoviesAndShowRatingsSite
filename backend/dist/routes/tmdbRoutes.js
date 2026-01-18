"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tmdbService_1 = __importDefault(require("../services/tmdbService"));
const router = (0, express_1.Router)();
const tmdbService = new tmdbService_1.default();
router.get('/search', async (req, res) => {
    try {
        const { query, year } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        const movies = await tmdbService.searchMovies(query, year ? Number(year) : undefined);
        const formattedResults = movies.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            description: movie.overview,
            posterUrl: tmdbService.getPosterUrl(movie.poster_path, 'w342'),
            rating: movie.vote_average,
            voteCount: movie.vote_count,
        }));
        res.json({
            results: formattedResults,
            total: movies.length,
        });
    }
    catch (error) {
        console.error('TMDB search API error:', error);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});
router.get('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tmdbId = Number(id);
        if (isNaN(tmdbId)) {
            return res.status(400).json({ error: 'Invalid TMDB ID' });
        }
        const movieDetails = await tmdbService.getMovieDetails(tmdbId);
        if (!movieDetails) {
            return res.status(404).json({ error: 'Movie not found on TMDB' });
        }
        const formattedMovie = {
            id: movieDetails.id,
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            year: new Date(movieDetails.release_date).getFullYear(),
            description: movieDetails.overview,
            posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path, 'w500'),
            backdropUrl: tmdbService.getBackdropUrl(movieDetails.backdrop_path),
            runtime: movieDetails.runtime,
            genres: movieDetails.genres.map(g => g.name),
            imdbId: movieDetails.imdb_id,
            rating: movieDetails.vote_average,
            voteCount: movieDetails.vote_count,
            popularity: movieDetails.popularity,
            releaseDate: movieDetails.release_date,
            tagline: movieDetails.tagline,
            status: movieDetails.status,
            homepage: movieDetails.homepage,
        };
        res.json(formattedMovie);
    }
    catch (error) {
        console.error('TMDB movie details API error:', error);
        res.status(500).json({ error: 'Failed to get movie details' });
    }
});
router.get('/match', async (req, res) => {
    try {
        const { title, year } = req.query;
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title parameter is required' });
        }
        const movieDetails = await tmdbService.getMovieByTitleAndYear(title, year ? Number(year) : undefined);
        if (!movieDetails) {
            return res.status(404).json({ error: 'Movie not found on TMDB' });
        }
        const formattedMovie = {
            id: movieDetails.id,
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            year: new Date(movieDetails.release_date).getFullYear(),
            description: movieDetails.overview,
            posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path, 'w500'),
            backdropUrl: tmdbService.getBackdropUrl(movieDetails.backdrop_path),
            runtime: movieDetails.runtime,
            genres: movieDetails.genres.map(g => g.name),
            imdbId: movieDetails.imdb_id,
            rating: movieDetails.vote_average,
            voteCount: movieDetails.vote_count,
            popularity: movieDetails.popularity,
            releaseDate: movieDetails.release_date,
            tagline: movieDetails.tagline,
        };
        res.json(formattedMovie);
    }
    catch (error) {
        console.error('TMDB match API error:', error);
        res.status(500).json({ error: 'Failed to match movie' });
    }
});
router.post('/import', async (req, res) => {
    try {
        const { tmdbId, watchedYear, addedBy } = req.body;
        if (!tmdbId || !addedBy) {
            return res.status(400).json({
                error: 'TMDB ID and addedBy are required',
                details: { tmdbId, addedBy }
            });
        }
        const movieDetails = await tmdbService.getMovieDetails(Number(tmdbId));
        if (!movieDetails) {
            return res.status(404).json({ error: 'Movie not found on TMDB' });
        }
        const movieData = {
            title: movieDetails.title,
            year: new Date(movieDetails.release_date).getFullYear(),
            description: movieDetails.overview || '',
            posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path),
            watchedYear: watchedYear || new Date(movieDetails.release_date).getFullYear(),
            addedBy: addedBy,
            tmdbId: movieDetails.id,
            imdbId: movieDetails.imdb_id,
            runtime: movieDetails.runtime,
            genres: movieDetails.genres.map(g => g.name).join(', '),
        };
        res.json({
            message: 'Movie ready for import',
            movie: movieData,
            source: 'tmdb',
        });
    }
    catch (error) {
        console.error('TMDB import API error:', error);
        res.status(500).json({ error: 'Failed to import movie from TMDB' });
    }
});
exports.default = router;
//# sourceMappingURL=tmdbRoutes.js.map