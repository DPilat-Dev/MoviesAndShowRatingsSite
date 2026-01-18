import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { movieApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'watchedYear' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Movie title"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Release Year *
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                min="1888"
                max={new Date().getFullYear() + 5}
                value={formData.year}
                onChange={handleChange}
                className="col-span-3"
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