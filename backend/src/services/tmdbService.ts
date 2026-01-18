import axios from 'axios';

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
  genres: Array<{ id: number; name: string }>;
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

class TMDBService {
  private apiKey: string;
  private baseURL = 'https://api.themoviedb.org/3';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TMDB_API_KEY || '';
  }
  
  /**
   * Search for movies by title
   */
  async searchMovies(query: string, year?: number): Promise<TMDBMovie[]> {
    try {
      const params: any = {
        api_key: this.apiKey,
        query,
        language: 'en-US',
        include_adult: false,
      };
      
      if (year) {
        params.year = year;
      }
      
      const response = await axios.get<TMDBSearchResult>(`${this.baseURL}/search/movie`, { params });
      return response.data.results;
    } catch (error) {
      console.error('TMDB search error:', error);
      return [];
    }
  }
  
  /**
   * Get movie details by TMDB ID
   */
  async getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails | null> {
    try {
      const response = await axios.get<TMDBMovieDetails>(`${this.baseURL}/movie/${tmdbId}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB movie details error:', error);
      return null;
    }
  }
  
  /**
   * Get movie details by title and year (fuzzy match)
   */
  async getMovieByTitleAndYear(title: string, year?: number): Promise<TMDBMovieDetails | null> {
    try {
      const searchResults = await this.searchMovies(title, year);
      
      if (searchResults.length === 0) {
        return null;
      }
      
      // Try to find exact match by title and year
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
      
      // Get full details for the best match
      return await this.getMovieDetails(exactMatch.id);
    } catch (error) {
      console.error('TMDB get by title/year error:', error);
      return null;
    }
  }
  
  /**
   * Get movie poster URL
   */
  getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!posterPath) {
      return null;
    }
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  }
  
  /**
   * Get backdrop URL
   */
  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) {
      return null;
    }
    return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
  }
  
  /**
   * Format movie data for our application
   */
  formatMovieForApp(tmdbMovie: TMDBMovieDetails, watchedYear?: number) {
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

export default TMDBService;