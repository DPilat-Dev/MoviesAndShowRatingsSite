/**
 * OMDB API Service for fetching movie details
 * 
 * Note: OMDB API requires an API key. You can get one for free at http://www.omdbapi.com/apikey.aspx
 * The API key should be stored in .env file as VITE_OMDB_API_KEY
 */

export interface OMDBMovie {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: Array<{
    Source: string
    Value: string
  }>
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

export interface OMDBError {
  Response: string
  Error: string
}

export interface OMDBSearchResult {
  Search: Array<{
    Title: string
    Year: string
    imdbID: string
    Type: string
    Poster: string
  }>
  totalResults: string
  Response: string
}

class OMDBServices {
  private apiKey: string
  private baseUrl = 'https://www.omdbapi.com'

  constructor() {
    this.apiKey = import.meta.env.VITE_OMDB_API_KEY || ''
  }

  /**
   * Search for movies by title
   */
  async searchMovies(title: string, year?: number): Promise<OMDBSearchResult | OMDBError> {
    if (!this.apiKey) {
      throw new Error('OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.')
    }

    const params = new URLSearchParams({
      apikey: this.apiKey,
      s: title,
      type: 'movie',
    })

    if (year) {
      params.append('y', year.toString())
    }

    try {
      const response = await fetch(`${this.baseUrl}/?${params}`)
      return await response.json()
    } catch (error) {
      console.error('OMDB API search error:', error)
      return {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API'
      }
    }
  }

  /**
   * Get movie details by title and year
   */
  async getMovieByTitle(title: string, year?: number): Promise<OMDBMovie | OMDBError> {
    if (!this.apiKey) {
      throw new Error('OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.')
    }

    const params = new URLSearchParams({
      apikey: this.apiKey,
      t: title,
      type: 'movie',
      plot: 'full',
    })

    if (year) {
      params.append('y', year.toString())
    }

    const url = `${this.baseUrl}/?${params}`

    try {
      const response = await fetch(url)
      const data = await response.json()
      return data
    } catch (error) {
      return {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API'
      }
    }
  }

  /**
   * Get movie details by IMDB ID
   */
  async getMovieById(imdbId: string): Promise<OMDBMovie | OMDBError> {
    if (!this.apiKey) {
      throw new Error('OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.')
    }

    const params = new URLSearchParams({
      apikey: this.apiKey,
      i: imdbId,
      type: 'movie',
      plot: 'full',
    })

    try {
      const response = await fetch(`${this.baseUrl}/?${params}`)
      return await response.json()
    } catch (error) {
      console.error('OMDB API get movie by ID error:', error)
      return {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API'
      }
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== ''
  }

  /**
   * Get placeholder poster URL
   */
  getPlaceholderPoster(): string {
    return 'https://via.placeholder.com/300x450/1e293b/64748b?text=No+Poster+Available'
  }

  /**
   * Get movie poster with fallback logic
   * 1. Try local posterUrl
   * 2. Use placeholder (skip OMDB to avoid API limits)
   */
  async getMoviePoster(_title: string, _year?: number, localPosterUrl?: string | null): Promise<string> {
    // 1. Use local poster if available
    if (localPosterUrl) {
      return localPosterUrl
    }

    // 2. Fallback to placeholder (skip OMDB to avoid API limits)
    return this.getPlaceholderPoster()
  }

  /**
   * Format movie runtime (e.g., "142 min" -> "2h 22m")
   */
  formatRuntime(runtime: string): string {
    if (!runtime || runtime === 'N/A') return 'N/A'
    
    const match = runtime.match(/(\d+)/)
    if (!match) return runtime
    
    const minutes = parseInt(match[1])
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  /**
   * Format IMDb rating
   */
  formatRating(rating: string): string {
    if (!rating || rating === 'N/A') return 'N/A'
    return `${rating}/10`
  }

  /**
   * Format box office
   */
  formatBoxOffice(boxOffice: string): string {
    if (!boxOffice || boxOffice === 'N/A') return 'N/A'
    return boxOffice
  }
}

export const omdbService = new OMDBServices()