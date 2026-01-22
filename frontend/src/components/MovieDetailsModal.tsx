import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Film, 
  Calendar, 
  Clock, 
  Star, 
  Users, 
  Globe, 
  Award, 
  BookOpen, 
  ExternalLink,
   AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { omdbService, type OMDBMovie, type OMDBError } from '@/services/omdbService'
import { movieApi } from '@/lib/api'

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
}

interface MovieDetailsModalProps {
  movie: Movie
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MovieDetailsModal({ movie, open, onOpenChange }: MovieDetailsModalProps) {
  const [omdbData, setOmdbData] = useState<OMDBMovie | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [localStats, setLocalStats] = useState<{
    averageRating: number
    totalRankings: number
    watchedYear: number
  }>({
    averageRating: movie.averageRating,
    totalRankings: movie.totalRankings,
    watchedYear: movie.watchedYear
  })

  useEffect(() => {
    if (open && movie) {
      fetchLocalStats()
      // Reset OMDB data when movie changes
      setOmdbData(null)
      setError(null)
      setUpdateSuccess(null)
      // Don't auto-fetch OMDB details to avoid API limits
      // User can click "Load OMDB Details" button if needed
    }
  }, [open, movie])

  const fetchMovieDetails = async () => {
    if (!omdbService.isConfigured()) {
      setError('OMDB API key not configured. Movie details unavailable.')
      return
    }

    setLoading(true)
    setError(null)
    setUpdateSuccess(null)
    
    try {
      const result = await omdbService.getMovieByTitle(movie.title, movie.year || undefined)
      
      if (result.Response === 'True') {
        setOmdbData(result as OMDBMovie)
      } else {
        const errorResult = result as OMDBError
        // Provide more user-friendly error messages
        let errorMessage = errorResult.Error || 'Movie not found in OMDB database'
        
        if (errorMessage.includes('API key')) {
          errorMessage = 'OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.'
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'OMDB API rate limit exceeded. Please try again in a few minutes.'
        } else if (errorMessage.includes('internet connection')) {
          errorMessage = 'Unable to connect to OMDB API. Please check your internet connection.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error fetching movie details:', err)
      setError('An unexpected error occurred while fetching movie details.')
    } finally {
      setLoading(false)
    }
  }

  const updateMovieMetadata = async () => {
    if (!omdbService.isConfigured()) {
      setError('OMDB API key not configured. Cannot update metadata.')
      return
    }

    setUpdating(true)
    setError(null)
    setUpdateSuccess(null)
    
    try {
      // First fetch OMDB data
      const result = await omdbService.getMovieByTitle(movie.title, movie.year || undefined)
      
      if (result.Response === 'True') {
        const omdbMovie = result as OMDBMovie
        
        // Prepare update data
        const updateData: any = {}
        
        // Update description if available and different
        if (omdbMovie.Plot && omdbMovie.Plot !== 'N/A' && omdbMovie.Plot !== movie.description) {
          updateData.description = omdbMovie.Plot
        }
        
        // Update poster if available and different
        if (omdbMovie.Poster && omdbMovie.Poster !== 'N/A' && omdbMovie.Poster !== movie.posterUrl) {
          updateData.posterUrl = omdbMovie.Poster
        }
        
        // Update year if different (but be careful with this)
        const omdbYear = omdbMovie.Year && omdbMovie.Year !== 'N/A' ? parseInt(omdbMovie.Year) : null
        if (omdbYear && omdbYear !== movie.year) {
          updateData.year = omdbYear
        }
        
        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await movieApi.updateMovie(movie.id, updateData)
          setUpdateSuccess('Movie metadata updated successfully!')
          
          // Refresh OMDB data display
          setOmdbData(omdbMovie)
          
          // Refresh local stats
          fetchLocalStats()
        } else {
          setUpdateSuccess('Movie metadata is already up to date.')
        }
      } else {
        const errorResult = result as OMDBError
        // Provide more user-friendly error messages
        let errorMessage = errorResult.Error || 'Movie not found in OMDB database'
        
        if (errorMessage.includes('API key')) {
          errorMessage = 'OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.'
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'OMDB API rate limit exceeded. Please try again in a few minutes.'
        } else if (errorMessage.includes('internet connection')) {
          errorMessage = 'Unable to connect to OMDB API. Please check your internet connection.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error updating movie metadata:', err)
      setError('An unexpected error occurred while updating movie metadata.')
    } finally {
      setUpdating(false)
    }
  }

  const fetchLocalStats = async () => {
    try {
      const response = await movieApi.getMovie(movie.id)
      if (response.data) {
        setLocalStats({
          averageRating: response.data.averageRating || 0,
          totalRankings: response.data.totalRankings || 0,
          watchedYear: response.data.watchedYear
        })
      }
    } catch (err) {
      console.error('Error fetching local stats:', err)
    }
  }

  const getPosterUrl = () => {
    try {
      if (omdbData?.Poster && omdbData.Poster !== 'N/A') {
        return omdbData.Poster
      }
      if (movie.posterUrl && movie.posterUrl.trim() !== '') {
        return movie.posterUrl
      }
      return omdbService.generateTempPoster(movie.title, movie.year)
    } catch (error) {
      console.error('Error generating poster URL:', error)
      // Fallback to a simple placeholder
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iMTUwIiB5PSIyMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGEzYjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiPk1vdmllIFBvc3RlcjwvdGV4dD48L3N2Zz4='
    }
  }

  const formatGenres = (genres: string) => {
    if (!genres || genres === 'N/A') return []
    return genres.split(', ').map(genre => genre.trim())
  }

  const formatActors = (actors: string) => {
    if (!actors || actors === 'N/A') return []
    return actors.split(', ').slice(0, 5) // Show only first 5 actors
  }

  const openIMDbPage = () => {
    if (omdbData?.imdbID) {
      window.open(`https://www.imdb.com/title/${omdbData.imdbID}`, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{movie.title} ({movie.year})</DialogTitle>
          <DialogDescription>
            {omdbData?.Genre ? omdbData.Genre : 'Movie details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
           {/* Success message */}
           {updateSuccess && (
             <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
               <div className="flex items-center">
                 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                 <span className="text-green-800 dark:text-green-300">{updateSuccess}</span>
               </div>
             </div>
           )}

           {/* Error message */}
           {error && (
             <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-lg">
               <div className="flex items-center">
                 <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                 <span className="text-amber-800 dark:text-amber-300">{error}</span>
               </div>
               <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                 Note: To enable OMDB integration, add your API key to .env file as VITE_OMDB_API_KEY
               </p>
             </div>
           )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading movie details...</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Poster and basic info */}
            <div className="lg:col-span-1 space-y-4">
               {/* Poster */}
               <div className="aspect-[2/3] rounded-lg overflow-hidden border">
                 <img 
                   src={getPosterUrl()} 
                   alt={movie.title}
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     // If image fails to load, show a simple fallback
                     e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iMTUwIiB5PSIyMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGEzYjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiPk1vdmllIFBvc3RlcjwvdGV4dD48L3N2Zz4='
                   }}
                 />
               </div>

              {/* Local stats */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Film className="h-4 w-4 mr-2" />
                    Bosnia Movie Rankings Stats
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Average Rating
                      </div>
                      <div className="font-bold">
                        {localStats.averageRating > 0 ? `${localStats.averageRating.toFixed(1)}/10` : 'No ratings yet'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        Total Ratings
                      </div>
                      <div className="font-bold">{localStats.totalRankings}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Watched Year
                      </div>
                      <div className="font-bold">{localStats.watchedYear}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* Update Metadata button */}
               {omdbService.isConfigured() && (
                 <Button 
                   onClick={updateMovieMetadata}
                   className="w-full"
                   variant="secondary"
                   disabled={updating}
                 >
                   {updating ? (
                     <>
                       <Loader2 className="h-4 w-4 animate-spin mr-2" />
                       Updating...
                     </>
                   ) : (
                     <>
                       <RefreshCw className="h-4 w-4 mr-2" />
                       Update Metadata from OMDB
                     </>
                   )}
                 </Button>
               )}

               {/* IMDb button */}
               {omdbData?.imdbID && (
                 <Button 
                   onClick={openIMDbPage}
                   className="w-full"
                   variant="outline"
                 >
                   <ExternalLink className="h-4 w-4 mr-2" />
                   View on IMDb
                 </Button>
               )}
            </div>

            {/* Right column: Movie details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic info */}
              {omdbData && (
                <>
                  {/* Ratings */}
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4 flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Ratings
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {omdbData.imdbRating !== 'N/A' && (
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {omdbService.formatRating(omdbData.imdbRating)}
                            </div>
                            <div className="text-sm text-muted-foreground">IMDb Rating</div>
                            {omdbData.imdbVotes !== 'N/A' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {parseInt(omdbData.imdbVotes.replace(/,/g, '')).toLocaleString()} votes
                              </div>
                            )}
                          </div>
                        )}
                        
                        {omdbData.Metascore !== 'N/A' && (
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {omdbData.Metascore}/100
                            </div>
                            <div className="text-sm text-muted-foreground">Metascore</div>
                          </div>
                        )}
                        
                        {omdbData.Ratings?.map((rating, index) => (
                          rating.Source !== 'Internet Movie Database' && rating.Source !== 'Metacritic' && (
                            <div key={index} className="text-center p-3 border rounded-lg">
                              <div className="text-lg font-bold">{rating.Value}</div>
                              <div className="text-sm text-muted-foreground">{rating.Source}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plot */}
                  {omdbData.Plot && omdbData.Plot !== 'N/A' && (
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-3 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Plot
                        </h3>
                        <p className="text-sm leading-relaxed">{omdbData.Plot}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Details grid */}
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {omdbData.Director && omdbData.Director !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">Director</div>
                            <div className="font-medium">{omdbData.Director}</div>
                          </div>
                        )}
                        
                        {omdbData.Writer && omdbData.Writer !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">Writer</div>
                            <div className="font-medium">{omdbData.Writer}</div>
                          </div>
                        )}
                        
                        {omdbData.Runtime && omdbData.Runtime !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Runtime
                            </div>
                            <div className="font-medium">{omdbService.formatRuntime(omdbData.Runtime)}</div>
                          </div>
                        )}
                        
                        {omdbData.Released && omdbData.Released !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Released
                            </div>
                            <div className="font-medium">{omdbData.Released}</div>
                          </div>
                        )}
                        
                        {omdbData.Language && omdbData.Language !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              <Globe className="h-3 w-3 inline mr-1" />
                              Language
                            </div>
                            <div className="font-medium">{omdbData.Language}</div>
                          </div>
                        )}
                        
                        {omdbData.Country && omdbData.Country !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">Country</div>
                            <div className="font-medium">{omdbData.Country}</div>
                          </div>
                        )}
                        
                        {omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">Box Office</div>
                            <div className="font-medium">{omdbService.formatBoxOffice(omdbData.BoxOffice)}</div>
                          </div>
                        )}
                        
                        {omdbData.Awards && omdbData.Awards !== 'N/A' && (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              <Award className="h-3 w-3 inline mr-1" />
                              Awards
                            </div>
                            <div className="font-medium">{omdbData.Awards}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Genres */}
                  {omdbData.Genre && omdbData.Genre !== 'N/A' && (
                    <div>
                      <h3 className="font-semibold mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                         {formatGenres(omdbData.Genre).map((genre, index) => (
                           <span 
                             key={index} 
                             className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                           >
                             {genre}
                           </span>
                         ))}
                      </div>
                    </div>
                  )}

                  {/* Actors */}
                  {omdbData.Actors && omdbData.Actors !== 'N/A' && (
                    <div>
                      <h3 className="font-semibold mb-2">Cast</h3>
                      <div className="flex flex-wrap gap-2">
                         {formatActors(omdbData.Actors).map((actor, index) => (
                           <span 
                             key={index} 
                             className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-border bg-background"
                           >
                             {actor}
                           </span>
                         ))}
                      </div>
                    </div>
                  )}
                </>
              )}

               {/* No OMDB data message or reload button */}
               {omdbService.isConfigured() && (
                 <div className="text-center py-4 text-muted-foreground">
                   {!omdbData ? (
                     <>
                       <Film className="h-12 w-12 mx-auto mb-3 opacity-50" />
                       <p>Movie details not loaded from OMDB</p>
                       <p className="text-sm mt-2 mb-4">Click below to load enhanced details (uses API call)</p>
                       <Button 
                         onClick={fetchMovieDetails}
                         disabled={loading}
                         className="mt-2"
                       >
                         {loading ? (
                           <>
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             Loading...
                           </>
                         ) : (
                           <>
                             <Search className="h-4 w-4 mr-2" />
                             Load OMDB Details
                           </>
                         )}
                       </Button>
                     </>
                   ) : (
                     <Button 
                       onClick={fetchMovieDetails}
                       disabled={loading}
                       variant="outline"
                       className="mt-2"
                     >
                       {loading ? (
                         <>
                           <Loader2 className="h-4 w-4 animate-spin mr-2" />
                           Reloading...
                         </>
                       ) : (
                         <>
                           <RefreshCw className="h-4 w-4 mr-2" />
                           Reload OMDB Details
                         </>
                       )}
                     </Button>
                   )}
                 </div>
               )}

              {/* API not configured message */}
              {!omdbService.isConfigured() && !error && (
                <div className="p-4 border rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2">Enable Enhanced Movie Details</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    To see movie posters, plot, cast, and ratings from OMDB:
                  </p>
                  <ol className="text-sm space-y-2 list-decimal pl-5">
                    <li>Get a free API key from <a href="http://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OMDB API</a></li>
                    <li>Add <code className="bg-muted-foreground/20 px-1 rounded">VITE_OMDB_API_KEY=your_api_key_here</code> to your <code className="bg-muted-foreground/20 px-1 rounded">.env</code> file</li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}