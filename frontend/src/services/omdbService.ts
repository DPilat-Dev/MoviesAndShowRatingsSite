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

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class OMDBServices {
  private apiKey: string
  private baseUrl = 'https://www.omdbapi.com'
  private cacheDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  constructor() {
    this.apiKey = import.meta.env.VITE_OMDB_API_KEY || ''
  }

  /**
   * Get cache key for a request
   */
  private getCacheKey(method: string, params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return `omdb_cache_${method}_${sortedParams}`
  }

  /**
   * Get cached data if available and not expired
   */
  private getFromCache<T>(cacheKey: string): T | null {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()

      if (now > entry.expiresAt) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return entry.data
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }

  /**
   * Save data to cache
   */
  private saveToCache<T>(cacheKey: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.cacheDuration
      }
      localStorage.setItem(cacheKey, JSON.stringify(entry))
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  /**
   * Clear expired cache entries
   */
  private cleanupCache(): void {
    try {
      const keysToRemove: string[] = []
      const now = Date.now()

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('omdb_cache_')) {
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const entry = JSON.parse(cached)
              if (now > entry.expiresAt) {
                keysToRemove.push(key)
              }
            }
          } catch (error) {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }

  /**
   * Search for movies by title
   */
  async searchMovies(title: string, year?: number): Promise<OMDBSearchResult | OMDBError> {
    if (!this.apiKey) {
      return {
        Response: 'False',
        Error: 'OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.'
      }
    }

    // Check cache first
    const cacheParams: Record<string, string> = {
      s: title,
      type: 'movie'
    }
    if (year) {
      cacheParams.y = year.toString()
    }
    
    const cacheKey = this.getCacheKey('search', cacheParams)
    const cached = this.getFromCache<OMDBSearchResult | OMDBError>(cacheKey)
    
    if (cached) {
      return cached
    }

    // Clean up expired cache entries periodically
    if (Math.random() < 0.01) { // 1% chance on each request
      this.cleanupCache()
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
      
      if (!response.ok) {
        const errorData: OMDBError = {
          Response: 'False',
          Error: `OMDB API error: ${response.status} ${response.statusText}`
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        const errorData: OMDBError = {
          Response: 'False',
          Error: 'Invalid response from OMDB API'
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      // Cache successful responses
      this.saveToCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('OMDB API search error:', error)
      const errorData: OMDBError = {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API. Please check your internet connection.'
      }
      this.saveToCache(cacheKey, errorData)
      return errorData
    }
  }

  /**
   * Get movie details by title and year
   */
  async getMovieByTitle(title: string, year?: number): Promise<OMDBMovie | OMDBError> {
    if (!this.apiKey) {
      return {
        Response: 'False',
        Error: 'OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.'
      }
    }

    // Check cache first
    const cacheParams: Record<string, string> = {
      t: title,
      type: 'movie',
      plot: 'full'
    }
    if (year) {
      cacheParams.y = year.toString()
    }
    
    const cacheKey = this.getCacheKey('getByTitle', cacheParams)
    const cached = this.getFromCache<OMDBMovie | OMDBError>(cacheKey)
    
    if (cached) {
      return cached
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
      
      if (!response.ok) {
        const errorData: OMDBError = {
          Response: 'False',
          Error: `OMDB API error: ${response.status} ${response.statusText}`
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        const errorData: OMDBError = {
          Response: 'False',
          Error: 'Invalid response from OMDB API'
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      // Check for rate limiting or other API errors
      if (data.Error && data.Error.includes('exceeded')) {
        const errorData: OMDBError = {
          Response: 'False',
          Error: 'OMDB API rate limit exceeded. Please try again later.'
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      // Cache successful responses
      this.saveToCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('OMDB API get movie error:', error)
      const errorData: OMDBError = {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API. Please check your internet connection.'
      }
      this.saveToCache(cacheKey, errorData)
      return errorData
    }
  }

  /**
   * Get movie details by IMDB ID
   */
  async getMovieById(imdbId: string): Promise<OMDBMovie | OMDBError> {
    if (!this.apiKey) {
      return {
        Response: 'False',
        Error: 'OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.'
      }
    }

    // Check cache first
    const cacheParams: Record<string, string> = {
      i: imdbId,
      type: 'movie',
      plot: 'full'
    }
    
    const cacheKey = this.getCacheKey('getById', cacheParams)
    const cached = this.getFromCache<OMDBMovie | OMDBError>(cacheKey)
    
    if (cached) {
      return cached
    }

    const params = new URLSearchParams({
      apikey: this.apiKey,
      i: imdbId,
      type: 'movie',
      plot: 'full',
    })

    try {
      const response = await fetch(`${this.baseUrl}/?${params}`)
      
      if (!response.ok) {
        const errorData: OMDBError = {
          Response: 'False',
          Error: `OMDB API error: ${response.status} ${response.statusText}`
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        const errorData: OMDBError = {
          Response: 'False',
          Error: 'Invalid response from OMDB API'
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      // Check for rate limiting or other API errors
      if (data.Error && data.Error.includes('exceeded')) {
        const errorData: OMDBError = {
          Response: 'False',
          Error: 'OMDB API rate limit exceeded. Please try again later.'
        }
        this.saveToCache(cacheKey, errorData)
        return errorData
      }
      
      // Cache successful responses
      this.saveToCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('OMDB API get movie by ID error:', error)
      const errorData: OMDBError = {
        Response: 'False',
        Error: 'Failed to fetch data from OMDB API. Please check your internet connection.'
      }
      this.saveToCache(cacheKey, errorData)
      return errorData
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
   * Generate a temporary poster with movie title and year
   */
  generateTempPoster(title: string, year?: number): string {
    // Create a data URL for a simple SVG poster
    const width = 300
    const height = 450
    const backgroundColor = '#0f172a' // slate-900
    const textColor = '#94a3b8' // slate-400
    const accentColor = '#3b82f6' // blue-500
    
    // Truncate title if too long
    const displayTitle = title.length > 30 ? title.substring(0, 27) + '...' : title
    const yearText = year ? `(${year})` : ''
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${accentColor}" stroke-width="2" rx="8"/>
        
        <!-- Film strip effect -->
        <rect x="20" y="20" width="${width - 40}" height="40" fill="${accentColor}" opacity="0.2" rx="4"/>
        <rect x="20" y="${height - 60}" width="${width - 40}" height="40" fill="${accentColor}" opacity="0.2" rx="4"/>
        
        <!-- Movie icon (using SVG path instead of emoji) -->
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="40" fill="${accentColor}" opacity="0.1"/>
        <g transform="translate(${width / 2}, ${height / 2 - 40})" fill="${accentColor}">
          <path d="M -20 -15 L 20 -15 L 20 15 L -20 15 Z" fill="none" stroke="currentColor" stroke-width="3"/>
          <path d="M -15 -10 L -5 -10 L -5 10 L -15 10 Z" fill="currentColor"/>
          <path d="M 5 -10 L 15 -10 L 15 10 L 5 10 Z" fill="currentColor"/>
        </g>
        
        <!-- Title -->
        <text x="${width / 2}" y="${height / 2 + 30}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
          ${displayTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </text>
        
        <!-- Year -->
        ${yearText ? `
          <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" fill="${accentColor}" font-family="Arial, sans-serif" font-size="16">
            ${yearText}
          </text>
        ` : ''}
        
        <!-- Footer text -->
        <text x="${width / 2}" y="${height - 30}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="12" opacity="0.7">
          Bosnia Movie Rankings
        </text>
      </svg>`.replace(/\s+/g, ' ').trim()
    
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  /**
   * Get movie poster with fallback logic
   * 1. Try local posterUrl
   * 2. Generate temporary poster with movie info
   */
  getMoviePoster(title: string, year?: number, localPosterUrl?: string | null): string {
    // 1. Use local poster if available and not empty
    if (localPosterUrl && localPosterUrl.trim() !== '') {
      return localPosterUrl
    }

    // 2. Generate temporary poster with movie title and year
    return this.generateTempPoster(title, year)
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

  /**
   * Clear all OMDB cache entries
   */
  clearCache(): void {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('omdb_cache_')) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log(`Cleared ${keysToRemove.length} cache entries`)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; expiredEntries: number } {
    try {
      let totalEntries = 0
      let expiredEntries = 0
      const now = Date.now()

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('omdb_cache_')) {
          totalEntries++
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const entry = JSON.parse(cached)
              if (now > entry.expiresAt) {
                expiredEntries++
              }
            }
          } catch (error) {
            // Ignore malformed entries
          }
        }
      }

      return { totalEntries, expiredEntries }
    } catch (error) {
      console.error('Cache stats error:', error)
      return { totalEntries: 0, expiredEntries: 0 }
    }
  }
}

export const omdbService = new OMDBServices()