import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Film, Star, Calendar, Eye } from 'lucide-react'
import { AddMovieModal } from '@/components/AddMovieModal'
import { RateMovieModal } from '@/components/RateMovieModal'
import { EditMovieModal } from '@/components/EditMovieModal'
import { ViewMovieRatingsModal } from '@/components/ViewMovieRatingsModal'
import { MovieDetailsModal } from '@/components/MovieDetailsModal'
import { EnhancedMovieFilters } from '@/components/EnhancedMovieFilters'
import { MovieCardSkeleton } from '@/components/Skeleton'
import { movieApi, rankingApi } from '@/lib/api'

interface Movie {
  id: string
  title: string
  year: number
  description: string | null
  posterUrl: string | null
  watchedYear: number
  addedBy: string
  createdAt: string
  averageRating: number
  totalRankings: number
  _count?: {
    rankings: number
  }
}

interface MovieStats {
  overall: {
    totalMovies: number
    averageWatchedYear: string
    oldestWatchedYear: number
    newestWatchedYear: number
    uniqueWatchedYears: number
    averageRating: number
  }
  byWatchedYear: Array<{
    year: number
    count: number
  }>
}

interface YearlyStats {
  yearRange: {
    min: number
    max: number
  }
  yearlyStats: Array<{
    year: number
    totalRankings: number
    averageRating: number
    uniqueUsers: number
    uniqueMovies: number
  }>
}

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [movieStats, setMovieStats] = useState<MovieStats | null>(null)
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showMovieDetails, setShowMovieDetails] = useState(false)
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10])
  const [releaseYearRange, setReleaseYearRange] = useState<[number, number]>([1900, new Date().getFullYear()])

  const fetchMovies = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Map frontend sort options to backend sort options
      let backendSortBy: 'title' | 'year' | 'watchedYear' | 'createdAt' | undefined
      let backendSortOrder: 'asc' | 'desc' = 'desc'
      
      if (sortBy) {
        if (sortBy.endsWith('_desc')) {
          backendSortBy = sortBy.replace('_desc', '') as any
          backendSortOrder = 'desc'
        } else {
          backendSortBy = sortBy as any
          backendSortOrder = 'asc'
        }
      }
      
      const response = await movieApi.getMovies({
        search: search || undefined,
        watchedYear: selectedYear ? parseInt(selectedYear) : undefined,
        sortBy: backendSortBy,
        sortOrder: backendSortOrder
      })
      
      let filteredMovies = response.data.data || []
      
      // Apply frontend filters (rating range and release year range)
      filteredMovies = filteredMovies.filter((movie: Movie) => {
        // Rating range filter
        if (movie.averageRating < ratingRange[0] || movie.averageRating > ratingRange[1]) {
          return false
        }
        
        // Release year range filter
        if (movie.year < releaseYearRange[0] || movie.year > releaseYearRange[1]) {
          return false
        }
        
        return true
      })
      
      setMovies(filteredMovies)
    } catch (error) {
      console.error('Failed to fetch movies:', error)
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedYear, sortBy, ratingRange, releaseYearRange])

  useEffect(() => {
    fetchMovies()
    fetchStats()
  }, [fetchMovies])

  const fetchStats = async () => {
    try {
      setIsStatsLoading(true)
      const [movieStatsResponse, yearlyStatsResponse] = await Promise.all([
        movieApi.getMovieStats(),
        rankingApi.getYearlyStats()
      ])
      setMovieStats(movieStatsResponse.data)
      setYearlyStats(yearlyStatsResponse.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const handleMovieAdded = () => {
    fetchMovies()
    fetchStats()
  }

  const hasActiveFilters = Boolean(search || selectedYear || sortBy || 
    ratingRange[0] > 0 || ratingRange[1] < 10 ||
    releaseYearRange[0] > 1900 || releaseYearRange[1] < new Date().getFullYear())

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground">
            Browse and manage all movies in the collection
          </p>
        </div>
        <AddMovieModal onMovieAdded={handleMovieAdded} />
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <EnhancedMovieFilters
            search={search}
            onSearchChange={setSearch}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onApplyFilters={fetchMovies}
            onClearFilters={() => {
              setSearch('')
              setSelectedYear('')
              setSortBy('')
              setRatingRange([0, 10])
              setReleaseYearRange([1900, new Date().getFullYear()])
              fetchMovies()
            }}
            ratingRange={ratingRange}
            onRatingRangeChange={setRatingRange}
            releaseYearRange={releaseYearRange}
            onReleaseYearRangeChange={setReleaseYearRange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardContent>
      </Card>

       {/* Movies grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : movies.length === 0 ? (
         <div className="text-center py-12 border rounded-lg">
           <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="text-lg font-semibold">No movies found</h3>
           <p className="text-muted-foreground mt-2">
             {hasActiveFilters ? 'Try changing your search filters' : 'Be the first to add a movie!'}
           </p>
         </div>
       ) : (
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {movies.map((movie) => (
             <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
               <div className="aspect-[2/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                 {movie.posterUrl ? (
                   <img 
                     src={movie.posterUrl} 
                     alt={movie.title}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <Film className="h-16 w-16 text-muted-foreground" />
                 )}
               </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{movie.title}</CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{movie.year} • Watched: {movie.watchedYear}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3" />
                      <span>{movie.totalRankings || 0} rating{movie.totalRankings !== 1 ? 's' : ''}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center">
                         <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-2" />
                         <div>
                           <span className="font-bold text-lg">{movie.averageRating > 0 ? `${movie.averageRating.toFixed(1)}/10` : '-/-'}</span>
                           <div className="text-xs text-muted-foreground">
                             Average rating
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-1">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0"
                           onClick={() => {
                             setSelectedMovie(movie)
                             setShowMovieDetails(true)
                           }}
                           title="View movie details"
                         >
                           <Film className="h-4 w-4" />
                         </Button>
                         <ViewMovieRatingsModal 
                           movie={movie}
                           trigger={
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View ratings">
                               <Eye className="h-4 w-4" />
                             </Button>
                           }
                         />
                         <EditMovieModal 
                           movie={movie}
                           onMovieUpdated={() => {
                             fetchMovies()
                             fetchStats()
                           }}
                           onMovieDeleted={() => {
                             fetchMovies()
                             fetchStats()
                           }}
                         />
                         <RateMovieModal 
                           movieId={movie.id}
                           movieTitle={movie.title}
                           onRatingAdded={() => {
                             fetchMovies()
                             fetchStats()
                           }}
                         />
                       </div>
                    </div>
                  {movie.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {movie.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Added by {movie.addedBy}
                  </p>
                </CardContent>
             </Card>
           ))}
         </div>
       )}

       {/* Stats */}
       <Card>
         <CardHeader>
           <CardTitle>Movie Statistics</CardTitle>
           <CardDescription>
             Overview of movie collection and rankings
           </CardDescription>
         </CardHeader>
         <CardContent>
           {isStatsLoading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
               <p className="mt-2 text-muted-foreground">Loading statistics...</p>
             </div>
           ) : (
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
               {movieStats && (
                 <div className="p-4 border rounded-lg">
                   <div className="text-2xl font-bold">{movieStats.overall.totalMovies}</div>
                   <div className="text-sm text-muted-foreground">Total Movies</div>
                   <div className="flex items-center mt-2">
                     <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                     <span className="text-sm">Avg: {movieStats.overall.averageRating}/10</span>
                   </div>
                 </div>
               )}
               {movieStats && (
                 <div className="p-4 border rounded-lg">
                   <div className="text-2xl font-bold">{movieStats.overall.uniqueWatchedYears}</div>
                   <div className="text-sm text-muted-foreground">Watched Years</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {movieStats.overall.oldestWatchedYear} - {movieStats.overall.newestWatchedYear}
                    </div>
                 </div>
               )}
               {yearlyStats && yearlyStats.yearlyStats.length > 0 && (
                 <>
                   {yearlyStats.yearlyStats.slice(0, 2).map((stat) => (
                     <div key={stat.year} className="p-4 border rounded-lg">
                       <div className="text-2xl font-bold">{stat.totalRankings}</div>
                       <div className="text-sm text-muted-foreground">Rankings in {stat.year}</div>
                       <div className="flex items-center mt-2">
                         <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                         <span className="text-sm">Avg: {stat.averageRating.toFixed(1)}/10</span>
                       </div>
                     </div>
                   ))}
                 </>
               )}
             </div>
           )}
         </CardContent>
       </Card>

       {/* Movie Details Modal */}
       {selectedMovie && (
         <MovieDetailsModal
           movie={selectedMovie}
           open={showMovieDetails}
           onOpenChange={setShowMovieDetails}
         />
       )}
    </div>
  )
}