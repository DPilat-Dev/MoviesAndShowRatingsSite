import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Star, Film, Calendar, Eye, TrendingUp } from 'lucide-react'
import { rankingApi } from '@/lib/api'

interface User {
  id: string
  username: string
  displayName: string
}

interface MovieRanking {
  id: string
  rating: number
  rankingYear: number
  rankedAt: string
  description?: string
  movie: {
    id: string
    title: string
    year: number
    watchedYear: number
  }
}

interface ViewUserRatingsModalProps {
  user: User
  trigger?: React.ReactNode
}

export function ViewUserRatingsModal({ user, trigger }: ViewUserRatingsModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rankings, setRankings] = useState<MovieRanking[]>([])
  const [stats, setStats] = useState({
    totalRankings: 0,
    averageRating: 0,
    highestRating: 0,
    lowestRating: 0,
    uniqueWatchedYears: new Set<number>()
  })
  const [topMovies, setTopMovies] = useState<MovieRanking[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'watchedYear' | 'rankedAt'>('rankedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchUserRankings = async () => {
    setIsLoading(true)
    try {
      const response = await rankingApi.getRankings({
        userId: user.id,
        limit: 1000 // Get all rankings
      })
      
      const rankingsData = response.data.data || []
      setRankings(rankingsData)
      
      // Calculate stats
      if (rankingsData.length > 0) {
        const ratings = rankingsData.map((r: MovieRanking) => r.rating)
        const watchedYears = new Set<number>(rankingsData.map((r: MovieRanking) => r.movie.watchedYear))
        
        // Get top 5 movies by rating
        const sortedByRating = [...rankingsData].sort((a, b) => b.rating - a.rating)
        const top5 = sortedByRating.slice(0, 5)
        
        setStats({
          totalRankings: rankingsData.length,
          averageRating: parseFloat((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)),
          highestRating: Math.max(...ratings),
          lowestRating: Math.min(...ratings),
          uniqueWatchedYears: watchedYears
        })
        setTopMovies(top5)
      }
    } catch (error) {
      console.error('Failed to fetch user rankings:', error)
      alert('Failed to load user ratings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchUserRankings()
    } else {
      // Reset when modal closes
      setRankings([])
      setStats({
        totalRankings: 0,
        averageRating: 0,
        highestRating: 0,
        lowestRating: 0,
        uniqueWatchedYears: new Set()
      })
      setSortBy('rankedAt')
      setSortOrder('desc')
    }
  }, [open, user.id])

  const sortedRankings = [...rankings].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'rating':
        aValue = a.rating
        bValue = b.rating
        break
      case 'title':
        aValue = a.movie.title.toLowerCase()
        bValue = b.movie.title.toLowerCase()
        break
      case 'watchedYear':
        aValue = a.movie.watchedYear
        bValue = b.movie.watchedYear
        break
      case 'rankedAt':
        aValue = new Date(a.rankedAt).getTime()
        bValue = new Date(b.rankedAt).getTime()
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (rating >= 6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'
  }

  const handleSort = (field: 'rating' | 'title' | 'watchedYear' | 'rankedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, label }: { field: 'rating' | 'title' | 'watchedYear' | 'rankedAt', label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={`h-8 ${sortBy === field ? 'bg-muted' : ''}`}
    >
      {label}
      {sortBy === field && (
        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </Button>
  )

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
          <DialogTitle>{user.displayName}'s Movie Ratings</DialogTitle>
          <DialogDescription>
            @{user.username} • {stats.totalRankings} total ratings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User stats */}
          {stats.totalRankings > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalRankings}</div>
                <div className="text-sm text-muted-foreground">Total Ratings</div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-xs">All time</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.averageRating}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs">Out of 10</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.highestRating}</div>
                <div className="text-sm text-muted-foreground">Highest Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-green-500 fill-green-500" />
                  <span className="text-xs">Best movie</span>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.lowestRating}</div>
                <div className="text-sm text-muted-foreground">Lowest Rating</div>
                <div className="flex items-center mt-2">
                  <Star className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                  <span className="text-xs">Worst movie</span>
                </div>
              </div>
            </div>
          )}

          {/* Top 5 Movies */}
          {topMovies.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-4 flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                Top 5 Movies All Time
              </h4>
              <div className="space-y-3">
                {topMovies.map((ranking, index) => (
                  <div key={ranking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{ranking.movie.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {ranking.movie.year} • Watched: {ranking.movie.watchedYear}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full font-bold ${getRatingColor(ranking.rating)}`}>
                      {ranking.rating}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sort controls */}
          {rankings.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <SortButton field="rankedAt" label="Date Rated" />
              <SortButton field="rating" label="Rating" />
              <SortButton field="title" label="Title" />
              <SortButton field="watchedYear" label="Watched Year" />
            </div>
          )}

          {/* Ratings list */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading ratings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold">No Ratings Found</h4>
              <p className="text-muted-foreground mt-2">
                {user.displayName} hasn't rated any movies yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRankings.map((ranking) => (
                <div key={ranking.id} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center rounded">
                          <Film className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{ranking.movie.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {ranking.movie.year} • 
                              Watched: {ranking.movie.watchedYear} • 
                              Rated: {new Date(ranking.rankedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                     <div className="flex items-center gap-4">
                       <div className={`px-3 py-2 rounded-lg ${getRatingColor(ranking.rating)}`}>
                         <div className="flex items-center">
                           <Star className="h-4 w-4 mr-1 fill-current" />
                           <span className="font-bold text-lg">{ranking.rating}/10</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Description if exists */}
                   {ranking.description && (
                     <div className="mt-3 ml-12">
                       <div className="text-sm text-muted-foreground italic">"{ranking.description}"</div>
                     </div>
                   )}
                 </div>
              ))}
            </div>
          )}

          {/* Watched years summary */}
          {stats.uniqueWatchedYears.size > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Watched Years</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(stats.uniqueWatchedYears)
                  .sort((a, b) => b - a)
                  .map((year) => {
                    const yearRankings = rankings.filter(r => r.movie.watchedYear === year)
                    const yearAvg = yearRankings.length > 0 
                      ? parseFloat((yearRankings.reduce((sum, r) => sum + r.rating, 0) / yearRankings.length).toFixed(1))
                      : 0
                    
                    return (
                      <div key={year} className="px-3 py-2 border rounded-lg">
                        <div className="font-medium">{year}</div>
                        <div className="text-sm text-muted-foreground">
                          {yearRankings.length} movie{yearRankings.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          <span>{yearAvg} avg</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
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