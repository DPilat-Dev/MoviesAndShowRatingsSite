import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Edit, Trash2 } from 'lucide-react'
import { movieApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Movie title"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Release Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, watchedYear: parseInt(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the movie..."
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="posterUrl">Poster URL</Label>
                <Input
                  id="posterUrl"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
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