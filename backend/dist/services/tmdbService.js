"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class TMDBService {
    apiKey;
    baseURL = 'https://api.themoviedb.org/3';
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.TMDB_API_KEY || '';
    }
    async searchMovies(query, year) {
        try {
            const params = {
                api_key: this.apiKey,
                query,
                language: 'en-US',
                include_adult: false,
            };
            if (year) {
                params.year = year;
            }
            const response = await axios_1.default.get(`${this.baseURL}/search/movie`, { params });
            return response.data.results;
        }
        catch (error) {
            console.error('TMDB search error:', error);
            return [];
        }
    }
    async getMovieDetails(tmdbId) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/movie/${tmdbId}`, {
                params: {
                    api_key: this.apiKey,
                    language: 'en-US',
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('TMDB movie details error:', error);
            return null;
        }
    }
    async getMovieByTitleAndYear(title, year) {
        try {
            const searchResults = await this.searchMovies(title, year);
            if (searchResults.length === 0) {
                return null;
            }
            let exactMatch = searchResults[0];
            if (year) {
                const yearMatches = searchResults.filter(movie => {
                    const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                    return movieYear === year;
                });
                if (yearMatches.length > 0) {
                    exactMatch = yearMatches[0];
                }
            }
            return await this.getMovieDetails(exactMatch.id);
        }
        catch (error) {
            console.error('TMDB get by title/year error:', error);
            return null;
        }
    }
    getPosterUrl(posterPath, size = 'w500') {
        if (!posterPath) {
            return null;
        }
        return `https://image.tmdb.org/t/p/${size}${posterPath}`;
    }
    getBackdropUrl(backdropPath, size = 'w1280') {
        if (!backdropPath) {
            return null;
        }
        return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
    }
    formatMovieForApp(tmdbMovie, watchedYear) {
        return {
            title: tmdbMovie.title,
            year: new Date(tmdbMovie.release_date).getFullYear(),
            description: tmdbMovie.overview,
            posterUrl: this.getPosterUrl(tmdbMovie.poster_path),
            backdropUrl: this.getBackdropUrl(tmdbMovie.backdrop_path),
            runtime: tmdbMovie.runtime,
            genres: tmdbMovie.genres.map(g => g.name),
            imdbId: tmdbMovie.imdb_id,
            rating: tmdbMovie.vote_average,
            voteCount: tmdbMovie.vote_count,
            watchedYear: watchedYear || new Date(tmdbMovie.release_date).getFullYear(),
            tmdbId: tmdbMovie.id,
        };
    }
}
exports.default = TMDBService;
//# sourceMappingURL=tmdbService.js.map