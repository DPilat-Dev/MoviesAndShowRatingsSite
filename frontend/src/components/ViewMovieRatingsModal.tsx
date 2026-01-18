import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Star, Users, Eye, TrendingUp } from 'lucide-react'
import { rankingApi } from '@/lib/api'
import { getUserAvatar } from '@/utils/avatarUtils'

interface Movie {
  id: string
  title: string
  year: number
  watchedYear: number
}

interface MovieRating {
  id: string
  rating: number
  rankingYear: number
  rankedAt: string
  description?: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}

interface ViewMovieRatingsModalProps {
  movie: Movie
  trigger?: React.ReactNode
}

export function ViewMovieRatingsModal({ movie, trigger }: ViewMovieRatingsModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ratings, setRatings] = useState<MovieRating[]>([])
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    highestRating: 0,
    lowestRating: 0,
    ratingDistribution: Array(10).fill(0) // Counts for ratings 1-10
  })

  const fetchMovieRatings = async () => {
    setIsLoading(true)
    try {
      const response = await rankingApi.getRankings({
        movieId: movie.id,
        limit: 1000 // Get all ratings
      })
      
      const ratingsData = response.data.data || []
      setRatings(ratingsData)
      
      // Calculate stats
      if (ratingsData.length > 0) {
        const ratingValues = ratingsData.map((r: MovieRating) => r.rating)
        const distribution = Array(10).fill(0)
        ratingValues.forEach((rating: number) => {
          distribution[rating - 1]++ // rating 1 goes to index 0, rating 10 goes to index 9
        })
        
        setStats({
          totalRatings: ratingsData.length,
          averageRating: parseFloat((ratingValues.reduce((a: number, b: number) => a + b, 0) / ratingValues.length).toFixed(1)),
          highestRating: Math.max(...ratingValues),
          lowestRating: Math.min(...ratingValues),
          ratingDistribution: distribution
        })
      }
    } catch (error) {
      console.error('Failed to fetch movie ratings:', error)
      alert('Failed to load movie ratings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchMovieRatings()
    } else {
      // Reset when modal closes
      setRatings([])
      setStats({
        totalRatings: 0,
        averageRating: 0,
        highestRating: 0,
        lowestRating: 0,
        ratingDistribution: Array(10).fill(0)
      })
    }
  }, [open, movie.id])

  const sortedRatings = [...ratings].sort((a, b) => {
    // Sort by rating (highest first), then by date (newest first)
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }
    return new Date(b.rankedAt).getTime() - new Date(a.rankedAt).getTime()
  })

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (rating >= 6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'
  }

  const getBarColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-500'
    if (rating >= 6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRatingPercentage = (count: number) => {
    return stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8">
            <Eye className="h-3 w-3 mr-1" />
            View Ratings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ratings for "{movie.title}"</DialogTitle>
          <DialogDescription>
            {movie.year} • Watched: {movie.watchedYear} • {stats.totalRatings} total ratings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Movie stats */}
          {stats.totalRatings > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalRatings}</div>
                <div className="text-sm text-muted-foreground">Total Ratings</div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-xs">All users</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.averageRating}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs">Community average</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.highestRating}</div>
                <div className="text-sm text-muted-foreground">Highest Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-green-500 fill-green-500" />
                  <span className="text-xs">Best rating</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.lowestRating}</div>
                <div className="text-sm text-muted-foreground">Lowest Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                  <span className="text-xs">Worst rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Rating distribution */}
          {stats.totalRatings > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-4">Rating Distribution</h4>
               <div className="space-y-2">
                 {stats.ratingDistribution.slice().reverse().map((count, index) => {
                   const rating = 10 - index // Reverse order: 10, 9, 8, ..., 1
                   const percentage = getRatingPercentage(count)
                   return (
                     <div key={rating} className="flex items-center">
                       <div className="w-12 text-sm font-medium">
                         {rating} ★
                       </div>
                       <div className="flex-1 ml-3">
                         <div className="h-6 bg-muted rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${getBarColor(rating)}`}
                             style={{ width: `${Math.max(percentage, 1)}%` }}
                           />
                         </div>
                       </div>
                       <div className="w-12 text-right text-sm text-muted-foreground">
                         {count} ({percentage.toFixed(0)}%)
                       </div>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}

          {/* Ratings list */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading ratings...</p>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold">No Ratings Yet</h4>
              <p className="text-muted-foreground mt-2">
                Be the first to rate this movie!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold">All Ratings ({ratings.length})</h4>
              {sortedRatings.map((rating) => (
                 <div key={rating.id} className="p-4 border rounded-lg hover:bg-muted/50">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getUserAvatar(rating.user)} 
                            alt={rating.user.displayName}
                            className="h-10 w-10 rounded-full border border-border object-cover"
                          />
                          <div>
                            <div className="font-medium">{rating.user.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              @{rating.user.username} • Rated on {new Date(rating.rankedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       <div className={`px-3 py-2 rounded-lg ${getRatingColor(rating.rating)}`}>
                         <div className="flex items-center">
                           <Star className="h-4 w-4 mr-1 fill-current" />
                           <span className="font-bold text-lg">{rating.rating}/10</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Description if exists */}
                   {rating.description && (
                     <div className="mt-3 ml-12">
                       <div className="text-sm text-muted-foreground italic">"{rating.description}"</div>
                     </div>
                   )}
                 </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}