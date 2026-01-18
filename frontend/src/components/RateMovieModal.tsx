import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { rankingApi } from '@/lib/api'

interface RateMovieModalProps {
  movieId: string
  movieTitle: string
  onRatingAdded: () => void
}

export function RateMovieModal({ movieId, movieTitle, onRatingAdded }: RateMovieModalProps) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError('')
      
      // Get current user from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setError('Please log in to rate movies')
        return
      }
      
      const user = JSON.parse(userStr)
      const currentYear = new Date().getFullYear()
      
      await rankingApi.createRanking({
        userId: user.id || user.username,
        movieId,
        rating,
        rankingYear: currentYear,
        description: description.trim() || undefined
      })
      
      setOpen(false)
      setRating(0)
      setDescription('')
      onRatingAdded()
    } catch (err: unknown) {
      console.error('Failed to submit rating:', err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } }
        setError(axiosError.response?.data?.error || 'Failed to submit rating')
      } else {
        setError('Failed to submit rating')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Rate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate "{movieTitle}"</DialogTitle>
          <DialogDescription>
            Rate this movie on a scale of 1-10 stars
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
           <div className="flex justify-center gap-0.5 mb-4 flex-wrap">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
               <button
                 key={star}
                 type="button"
                 className="p-0.5"
                 onClick={() => setRating(star)}
                 onMouseEnter={() => setHoverRating(star)}
                 onMouseLeave={() => setHoverRating(0)}
               >
                 <Star
                   className={`h-7 w-7 ${
                     star <= (hoverRating || rating)
                       ? 'text-yellow-500 fill-yellow-500'
                       : 'text-gray-300'
                   }`}
                 />
               </button>
             ))}
           </div>
          
           <div className="text-center">
             <p className="text-lg font-semibold">
               {rating > 0 ? `${rating}/10` : 'Select a rating'}
             </p>
             <p className="text-sm text-muted-foreground mt-2">
               {rating === 10 && 'Masterpiece!'}
               {rating === 9 && 'Excellent'}
               {rating === 8 && 'Great'}
               {rating === 7 && 'Good'}
               {rating === 6 && 'Decent'}
               {rating === 5 && 'Average'}
               {rating === 4 && 'Below Average'}
               {rating === 3 && 'Poor'}
               {rating === 2 && 'Bad'}
               {rating === 1 && 'Terrible'}
             </p>
           </div>
           
           {/* Optional description */}
           <div className="mt-6">
             <label className="block text-sm font-medium mb-2">
               Optional Comment
               <span className="text-muted-foreground text-xs ml-2">(Why did you give this rating?)</span>
             </label>
             <Textarea
               placeholder="Share your thoughts about this movie (optional)..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="min-h-[80px]"
               maxLength={500}
             />
             <div className="text-xs text-muted-foreground mt-1 text-right">
               {description.length}/500 characters
             </div>
           </div>
           
           {error && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
               <p className="text-sm text-red-600">{error}</p>
             </div>
           )}
        </div>
        
        <DialogFooter>
           <Button
             variant="outline"
             onClick={() => {
               setOpen(false)
               setRating(0)
               setDescription('')
               setError('')
             }}
             disabled={isSubmitting}
           >
             Cancel
           </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}