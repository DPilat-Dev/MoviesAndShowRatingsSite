export interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
}
export interface TMDBMovieDetails extends TMDBMovie {
    runtime: number;
    genres: Array<{
        id: number;
        name: string;
    }>;
    imdb_id: string | null;
    homepage: string | null;
    tagline: string | null;
    status: string;
    revenue: number;
    budget: number;
}
export interface TMDBSearchResult {
    page: number;
    results: TMDBMovie[];
    total_pages: number;
    total_results: number;
}
declare class TMDBService {
    private apiKey;
    private baseURL;
    constructor(apiKey?: string);
    searchMovies(query: string, year?: number): Promise<TMDBMovie[]>;
    getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails | null>;
    getMovieByTitleAndYear(title: string, year?: number): Promise<TMDBMovieDetails | null>;
    getPosterUrl(posterPath: string | null, size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'): string | null;
    getBackdropUrl(backdropPath: string | null, size?: 'w300' | 'w780' | 'w1280' | 'original'): string | null;
    formatMovieForApp(tmdbMovie: TMDBMovieDetails, watchedYear?: number): {
        title: string;
        year: number;
        description: string;
        posterUrl: string | null;
        backdropUrl: string | null;
        runtime: number;
        genres: string[];
        imdbId: string | null;
        rating: number;
        voteCount: number;
        watchedYear: number;
        tmdbId: number;
    };
}
export default TMDBService;
//# sourceMappingURL=tmdbService.d.ts.map