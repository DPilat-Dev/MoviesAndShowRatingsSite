import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { movieApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'
import { omdbService, type OMDBError } from '@/services/omdbService'

interface AddMovieModalProps {
  onMovieAdded?: () => void
}

export function AddMovieModal({ onMovieAdded }: AddMovieModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useUser()

  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear(),
    description: '',
    posterUrl: '',
    watchedYear: new Date().getFullYear(),
  })

  const [fetchingOMDB, setFetchingOMDB] = useState(false)
  const [omdbError, setOmdbError] = useState('')
  const [omdbSuccess, setOmdbSuccess] = useState('')
  const [omdbData, setOmdbData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.title.trim()) {
      setError('Movie title is required')
      return
    }

    if (!formData.year || formData.year < 1888) { // First movie year
      setError('Please enter a valid year')
      return
    }

    if (!formData.watchedYear || formData.watchedYear < 2000) {
      setError('Please enter a valid watched year')
      return
    }

    if (!user) {
      setError('You must be logged in to add a movie')
      return
    }

    setIsLoading(true)

    try {
      await movieApi.createMovie({
        title: formData.title,
        year: formData.year,
        description: formData.description,
        posterUrl: formData.posterUrl,
        watchedYear: formData.watchedYear,
        addedBy: user.username,
      })

      setOpen(false)
      setFormData({
        title: '',
        year: new Date().getFullYear(),
        description: '',
        posterUrl: '',
        watchedYear: new Date().getFullYear(),
      })
      
       resetForm()
       setOpen(false)
       
       if (onMovieAdded) {
        onMovieAdded()
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        setError(axiosError.response?.data?.error || 'Failed to add movie')
      } else {
        setError('Failed to add movie')
      }
    } finally {
      setIsLoading(false)
    }
  }

   const handleFetchOMDB = async () => {
    if (!formData.title.trim()) {
      setOmdbError('Please enter a movie title first')
      return
    }

    if (!omdbService.isConfigured()) {
      setOmdbError('OMDB API key not configured. Please add VITE_OMDB_API_KEY to your .env file.')
      return
    }

    setFetchingOMDB(true)
    setOmdbError('')
    setOmdbSuccess('')
    setOmdbData(null)

    try {
      const result = await omdbService.getMovieByTitle(formData.title, formData.year)
      
      if (result.Response === 'True') {
        const movieData = result as any
        
        // Update form with OMDB data
        setFormData(prev => ({
          ...prev,
          description: movieData.Plot && movieData.Plot !== 'N/A' ? movieData.Plot : prev.description,
          posterUrl: movieData.Poster && movieData.Poster !== 'N/A' ? movieData.Poster : prev.posterUrl,
          year: movieData.Year && movieData.Year !== 'N/A' ? parseInt(movieData.Year) : prev.year
        }))
        
        setOmdbData(movieData)
        setOmdbSuccess(`Found "${movieData.Title}" (${movieData.Year})`)
      } else {
        const errorResult = result as OMDBError
        setOmdbError(errorResult.Error || 'Movie not found in OMDB database')
      }
    } catch (err) {
      console.error('Error fetching from OMDB:', err)
      setOmdbError('Failed to fetch movie details')
    } finally {
      setFetchingOMDB(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      year: new Date().getFullYear(),
      description: '',
      posterUrl: '',
      watchedYear: new Date().getFullYear(),
    })
    setOmdbData(null)
    setOmdbError('')
    setOmdbSuccess('')
    setError('')
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'watchedYear' ? parseInt(value) || 0 : value
    }))
    
    // Clear OMDB data when title changes
    if (name === 'title') {
      setOmdbData(null)
      setOmdbError('')
      setOmdbSuccess('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Movie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Movie</DialogTitle>
          <DialogDescription>
            Add a new movie to the rankings collection
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="flex-1"
                  placeholder="Movie title"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchOMDB}
                  disabled={fetchingOMDB || !formData.title.trim()}
                  title="Fetch movie details from OMDB"
                >
                  {fetchingOMDB ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* OMDB status messages */}
            {(omdbError || omdbSuccess || omdbData) && (
              <div className="col-span-4">
                {omdbError && (
                  <div className="p-3 mb-2 text-sm bg-destructive/10 text-destructive rounded-md flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{omdbError}</span>
                  </div>
                )}
                {omdbSuccess && (
                  <div className="p-3 mb-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{omdbSuccess}</span>
                  </div>
                )}
                {omdbData && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="text-sm font-medium mb-2">OMDB Data Found:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {omdbData.Director && omdbData.Director !== 'N/A' && (
                        <div>
                          <span className="text-muted-foreground">Director:</span>
                          <div className="font-medium truncate">{omdbData.Director}</div>
                        </div>
                      )}
                      {omdbData.Runtime && omdbData.Runtime !== 'N/A' && (
                        <div>
                          <span className="text-muted-foreground">Runtime:</span>
                          <div className="font-medium">{omdbService.formatRuntime(omdbData.Runtime)}</div>
                        </div>
                      )}
                      {omdbData.Genre && omdbData.Genre !== 'N/A' && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Genre:</span>
                          <div className="font-medium truncate">{omdbData.Genre}</div>
                        </div>
                      )}
                      {omdbData.imdbRating && omdbData.imdbRating !== 'N/A' && (
                        <div>
                          <span className="text-muted-foreground">IMDb Rating:</span>
                          <div className="font-medium">{omdbService.formatRating(omdbData.imdbRating)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year *
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                className="col-span-3"
                min="1888"
                max={new Date().getFullYear() + 5}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="watchedYear" className="text-right">
                Watched Year *
              </Label>
              <Input
                id="watchedYear"
                name="watchedYear"
                type="number"
                min="2000"
                max={new Date().getFullYear() + 1}
                value={formData.watchedYear}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Brief description of the movie"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="posterUrl" className="text-right">
                Poster URL
              </Label>
              <Input
                id="posterUrl"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                className="col-span-3"
                placeholder="https://example.com/poster.jpg"
                type="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Movie'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}