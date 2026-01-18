import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Edit, Trash2, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { movieApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'
import { omdbService, type OMDBError } from '@/services/omdbService'

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

interface EditMovieModalProps {
  movie: Movie
  onMovieUpdated?: () => void
  onMovieDeleted?: () => void
}

export function EditMovieModal({ movie, onMovieUpdated, onMovieDeleted }: EditMovieModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const { user } = useUser()

  const [formData, setFormData] = useState({
    title: movie.title,
    year: movie.year,
    description: movie.description || '',
    posterUrl: movie.posterUrl || '',
    watchedYear: movie.watchedYear,
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

    if (!formData.year || formData.year < 1888) {
      setError('Please enter a valid year')
      return
    }

    if (!formData.watchedYear || formData.watchedYear < 2000) {
      setError('Please enter a valid watched year')
      return
    }

    if (!user) {
      setError('You must be logged in to edit a movie')
      return
    }

    try {
      setIsLoading(true)
      await movieApi.updateMovie(movie.id, {
        title: formData.title,
        year: formData.year,
        description: formData.description || undefined,
        posterUrl: formData.posterUrl || undefined,
        watchedYear: formData.watchedYear,
      })
      
      setOpen(false)
      if (onMovieUpdated) {
        onMovieUpdated()
      }
    } catch (error: any) {
      console.error('Failed to update movie:', error)
      setError(error.response?.data?.message || 'Failed to update movie')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${movie.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)
      await movieApi.deleteMovie(movie.id)
      
      setOpen(false)
      if (onMovieDeleted) {
        onMovieDeleted()
      }
    } catch (error: any) {
      console.error('Failed to delete movie:', error)
      setError(error.response?.data?.message || 'Failed to delete movie')
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

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear OMDB data when title changes
    if (field === 'title') {
      setOmdbData(null)
      setOmdbError('')
      setOmdbSuccess('')
    }
  }

  const resetForm = () => {
    setFormData({
      title: movie.title,
      year: movie.year,
      description: movie.description || '',
      posterUrl: movie.posterUrl || '',
      watchedYear: movie.watchedYear,
    })
    setOmdbData(null)
    setOmdbError('')
    setOmdbSuccess('')
    setError('')
    setIsDeleteMode(false)
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isDeleteMode ? 'Delete Movie' : 'Edit Movie'}</DialogTitle>
          <DialogDescription>
            {isDeleteMode 
              ? `Are you sure you want to delete "${movie.title}"?`
              : 'Make changes to the movie details here.'}
          </DialogDescription>
        </DialogHeader>
        
        {isDeleteMode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete "{movie.title}" and all associated ratings. This action cannot be undone.
            </p>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {error}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteMode(false)
                  setError('')
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Movie'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="title">Title *</Label>
                 <div className="flex gap-2">
                   <Input
                     id="title"
                     value={formData.title}
                     onChange={(e) => handleChange('title', e.target.value)}
                     placeholder="Movie title"
                     required
                     className="flex-1"
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
                 <div className="space-y-2">
                   {omdbError && (
                     <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-start">
                       <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                       <span>{omdbError}</span>
                     </div>
                   )}
                   {omdbSuccess && (
                     <div className="p-3 text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md flex items-start">
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
               
               <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Release Year *</Label>
                   <Input
                     id="year"
                     type="number"
                     value={formData.year}
                     onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)}
                     placeholder="2024"
                     min="1888"
                     max={new Date().getFullYear() + 5}
                     required
                   />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="watchedYear">Watched Year *</Label>
                   <Input
                     id="watchedYear"
                     type="number"
                     value={formData.watchedYear}
                     onChange={(e) => handleChange('watchedYear', parseInt(e.target.value) || 0)}
                     placeholder="2024"
                     min="2000"
                     max={new Date().getFullYear()}
                     required
                   />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                 <Textarea
                   id="description"
                   value={formData.description}
                   onChange={(e) => handleChange('description', e.target.value)}
                   placeholder="Brief description of the movie..."
                   rows={3}
                 />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="posterUrl">Poster URL</Label>
                 <Input
                   id="posterUrl"
                   value={formData.posterUrl}
                   onChange={(e) => handleChange('posterUrl', e.target.value)}
                   placeholder="https://example.com/poster.jpg"
                   type="url"
                 />
              </div>
              
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteMode(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}