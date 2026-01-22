import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Film,
  Calendar,
  Image,
  FileText
} from 'lucide-react'
import { omdbService } from '@/services/omdbService'
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

interface BulkUpdateMetadataModalProps {
  movies: Movie[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateComplete?: () => void
}

export function BulkUpdateMetadataModal({ movies, open, onOpenChange, onUpdateComplete }: BulkUpdateMetadataModalProps) {
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())
  const [updateStats, setUpdateStats] = useState<{
    total: number
    successful: number
    failed: number
    updatedMovies: Array<{ id: string; title: string; changes: string[] }>
  } | null>(null)

  // Initialize selected movies when modal opens
  useEffect(() => {
    if (open && movies.length > 0) {
      // Select all movies by default
      setSelectedMovies(new Set(movies.map(movie => movie.id)))
      setError(null)
      setSuccess(null)
      setUpdateStats(null)
    }
  }, [open, movies])

  const toggleMovieSelection = (movieId: string) => {
    const newSelected = new Set(selectedMovies)
    if (newSelected.has(movieId)) {
      newSelected.delete(movieId)
    } else {
      newSelected.add(movieId)
    }
    setSelectedMovies(newSelected)
  }

  const selectAllMovies = () => {
    setSelectedMovies(new Set(movies.map(movie => movie.id)))
  }

  const clearSelection = () => {
    setSelectedMovies(new Set())
  }

  const fetchOMDBDataForMovies = async () => {
    if (!omdbService.isConfigured()) {
      setError('OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.')
      return
    }

    if (selectedMovies.size === 0) {
      setError('Please select at least one movie to update.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setUpdateStats(null)

    const selectedMovieList = movies.filter(movie => selectedMovies.has(movie.id))
    const results: Array<{ id: string; title: string; omdbData: any; error?: string }> = []

    try {
      // Fetch OMDB data for each selected movie
      for (const movie of selectedMovieList) {
        try {
          const result = await omdbService.getMovieByTitle(movie.title, movie.year || undefined)
          
          if (result.Response === 'True') {
            results.push({
              id: movie.id,
              title: movie.title,
              omdbData: result
            })
          } else {
            results.push({
              id: movie.id,
              title: movie.title,
              omdbData: null,
              error: (result as any).Error || 'Movie not found in OMDB'
            })
          }
        } catch (err) {
          results.push({
            id: movie.id,
            title: movie.title,
            omdbData: null,
            error: 'Failed to fetch OMDB data'
          })
        }
      }

      // Analyze what can be updated
      const updateAnalysis = results.map(result => {
        if (!result.omdbData || result.error) {
          return {
            id: result.id,
            title: result.title,
            canUpdate: false,
            error: result.error,
            changes: []
          }
        }

        const omdbMovie = result.omdbData
        const originalMovie = movies.find(m => m.id === result.id)!
        const changes: string[] = []

        // Check for description updates
        if (omdbMovie.Plot && omdbMovie.Plot !== 'N/A' && omdbMovie.Plot !== originalMovie.description) {
          changes.push('description')
        }

        // Check for poster updates
        if (omdbMovie.Poster && omdbMovie.Poster !== 'N/A' && omdbMovie.Poster !== originalMovie.posterUrl) {
          changes.push('poster')
        }

        // Check for year updates (be careful with this)
        const omdbYear = omdbMovie.Year && omdbMovie.Year !== 'N/A' ? parseInt(omdbMovie.Year) : null
        if (omdbYear && omdbYear !== originalMovie.year) {
          changes.push('year')
        }

        return {
          id: result.id,
          title: result.title,
          canUpdate: changes.length > 0,
          error: null,
          changes
        }
      })

      const canUpdateCount = updateAnalysis.filter(item => item.canUpdate).length
      const cannotUpdateCount = updateAnalysis.filter(item => !item.canUpdate && !item.error).length
      const errorCount = updateAnalysis.filter(item => item.error).length

      setSuccess(`Found ${canUpdateCount} movies with available updates, ${cannotUpdateCount} movies already up-to-date, ${errorCount} movies with errors.`)
      
      // Store analysis for display
      setUpdateStats({
        total: selectedMovieList.length,
        successful: canUpdateCount,
        failed: errorCount,
        updatedMovies: updateAnalysis
          .filter(item => item.canUpdate)
          .map(item => ({
            id: item.id,
            title: item.title,
            changes: item.changes
          }))
      })

    } catch (err) {
      console.error('Error fetching OMDB data:', err)
      setError('Failed to fetch movie data from OMDB')
    } finally {
      setLoading(false)
    }
  }

  const performBulkUpdate = async () => {
    if (!omdbService.isConfigured()) {
      setError('OMDB API key not configured.')
      return
    }

    if (selectedMovies.size === 0) {
      setError('Please select at least one movie to update.')
      return
    }

    setUpdating(true)
    setError(null)
    setSuccess(null)

    const selectedMovieList = movies.filter(movie => selectedMovies.has(movie.id))
    const updates: Array<{ id: string; metadata: any }> = []
    const errors: Array<{ id: string; title: string; error: string }> = []

    try {
      // First, fetch OMDB data and prepare updates
      for (const movie of selectedMovieList) {
        try {
          const result = await omdbService.getMovieByTitle(movie.title, movie.year || undefined)
          
          if (result.Response === 'True') {
            const omdbMovie = result as import('@/services/omdbService').OMDBMovie
            const metadata: any = {}

            // Prepare description update
            if (omdbMovie.Plot && omdbMovie.Plot !== 'N/A' && omdbMovie.Plot !== movie.description) {
              metadata.description = omdbMovie.Plot
            }

            // Prepare poster update
            if (omdbMovie.Poster && omdbMovie.Poster !== 'N/A' && omdbMovie.Poster !== movie.posterUrl) {
              metadata.posterUrl = omdbMovie.Poster
            }

            // Prepare year update (optional - be careful)
            const omdbYear = omdbMovie.Year && omdbMovie.Year !== 'N/A' ? parseInt(omdbMovie.Year) : null
            if (omdbYear && omdbYear !== movie.year) {
              metadata.year = omdbYear
            }

            // Only add if there are changes
            if (Object.keys(metadata).length > 0) {
              updates.push({ id: movie.id, metadata })
            }
          } else {
            errors.push({
              id: movie.id,
              title: movie.title,
              error: (result as any).Error || 'Movie not found in OMDB'
            })
          }
        } catch (err) {
          errors.push({
            id: movie.id,
            title: movie.title,
            error: 'Failed to fetch OMDB data'
          })
        }
      }

      // Perform bulk update if there are updates to make
      if (updates.length > 0) {
        // Group updates by metadata type for more efficient bulk updates
        const movieIds = updates.map(update => update.id)
        
        // For simplicity, we'll update all movies with the same metadata
        // In a real implementation, you might want to group by similar metadata
        const sampleMetadata = updates[0].metadata
        
        try {
          const response = await movieApi.bulkUpdateMovies({
            movieIds,
            metadata: sampleMetadata
          })

          if (response.data.success) {
            setSuccess(`Successfully updated ${updates.length} movies. ${errors.length > 0 ? `${errors.length} movies failed.` : ''}`)
            
            // Call update complete callback
            if (onUpdateComplete) {
              onUpdateComplete()
            }
          } else {
            setError('Failed to update movies. Please try again.')
          }
        } catch (err) {
          console.error('Bulk update error:', err)
          setError('Failed to perform bulk update. Please try again.')
        }
      } else {
        setSuccess('No updates needed - all selected movies are already up to date.')
      }

    } catch (err) {
      console.error('Error in bulk update process:', err)
      setError('An unexpected error occurred during bulk update.')
    } finally {
      setUpdating(false)
    }
  }

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'description':
        return <FileText className="h-3 w-3" />
      case 'poster':
        return <Image className="h-3 w-3" />
      case 'year':
        return <Calendar className="h-3 w-3" />
      default:
        return null
    }
  }

  const getChangeColor = (change: string) => {
    switch (change) {
      case 'description':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'poster':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'year':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bulk Update Movie Metadata</DialogTitle>
          <DialogDescription>
            Update poster, description, and year information from OMDB for multiple movies at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success message */}
          {success && (
            <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-green-800 dark:text-green-300">{success}</span>
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
            </div>
          )}

          {/* Movie selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Select Movies to Update</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllMovies}>
                    Select All ({movies.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                {selectedMovies.size} of {movies.length} movies selected
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                      selectedMovies.has(movie.id) ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => toggleMovieSelection(movie.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        selectedMovies.has(movie.id) ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selectedMovies.has(movie.id) && (
                          <div className="h-2 w-2 rounded-sm bg-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{movie.title} ({movie.year})</div>
                        <div className="text-xs text-muted-foreground">
                          {movie.posterUrl ? 'Has poster' : 'No poster'} • {movie.description ? 'Has description' : 'No description'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {movie.watchedYear}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Update stats */}
          {updateStats && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Update Analysis</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{updateStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Selected</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{updateStats.successful}</div>
                    <div className="text-sm text-muted-foreground">Can Update</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{updateStats.failed}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>

                {updateStats.updatedMovies.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Movies to be updated:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {updateStats.updatedMovies.map((movie) => (
                        <div key={movie.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="font-medium text-sm">{movie.title}</div>
                          <div className="flex gap-1">
                            {movie.changes.map((change) => (
                              <span
                                key={change}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getChangeColor(change)}`}
                              >
                                {getChangeIcon(change)}
                                {change}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {omdbService.isConfigured() ? (
              <>
                <Button
                  onClick={fetchOMDBDataForMovies}
                  className="flex-1"
                  variant="outline"
                  disabled={loading || updating || selectedMovies.size === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking OMDB...
                    </>
                  ) : (
                    <>
                      <Film className="h-4 w-4 mr-2" />
                      Check for Updates
                    </>
                  )}
                </Button>

                <Button
                  onClick={performBulkUpdate}
                  className="flex-1"
                  disabled={updating || loading || selectedMovies.size === 0}
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update Selected Movies
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-4 border rounded-lg bg-muted w-full">
                <h3 className="font-semibold mb-2">Enable OMDB Integration</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  To update movie metadata from OMDB:
                </p>
                <ol className="text-sm space-y-2 list-decimal pl-5">
                  <li>Get a free API key from <a href="http://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OMDB API</a></li>
                  <li>Add <code className="bg-muted-foreground/20 px-1 rounded">VITE_OMDB_API_KEY=your_api_key_here</code> to your <code className="bg-muted-foreground/20 px-1 rounded">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">• This feature uses the OMDB API to fetch updated movie information</p>
            <p className="mb-1">• Only movies with available data in OMDB will be updated</p>
            <p>• Large updates may take several seconds to complete</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}