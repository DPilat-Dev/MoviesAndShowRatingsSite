import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Star, Film, TrendingUp } from 'lucide-react'
import { rankingApi } from '@/lib/api'
import { getUserAvatar } from '@/utils/avatarUtils'

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

interface MovieRanking {
  movieId: string
  title: string
  year: number
  watchedYear: number
  rating: number
  description?: string
}

interface UserRankings {
  user: User
  rankings: MovieRanking[]
  averageRating: number
  totalRankings: number
}

interface CompareUsersModalProps {
  users: User[]
  trigger?: React.ReactNode
  initialUser?: string
}

export function CompareUsersModal({ users, trigger, initialUser }: CompareUsersModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedUser1, setSelectedUser1] = useState<string>(initialUser || '')
  const [selectedUser2, setSelectedUser2] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [user1Data, setUser1Data] = useState<UserRankings | null>(null)
  const [user2Data, setUser2Data] = useState<UserRankings | null>(null)
  const [commonMovies, setCommonMovies] = useState<Array<{
    movieId: string
    title: string
    year: number
    watchedYear: number
    rating1: number
    rating2: number
    difference: number
  }>>([])

  const fetchUserRankings = async (userId: string): Promise<UserRankings> => {
    const response = await rankingApi.getRankings({
      userId,
      limit: 1000 // Get all rankings for comparison
    })
    
    const rankings = response.data.data || []
    const user = users.find(u => u.id === userId)
    
    // Calculate average rating
    const averageRating = rankings.length > 0 
      ? rankings.reduce((sum: number, r: any) => sum + r.rating, 0) / rankings.length
      : 0
    
    return {
      user: user || { id: userId, username: 'Unknown', displayName: 'Unknown User' },
      rankings: rankings.map((r: any) => ({
        movieId: r.movie.id,
        title: r.movie.title,
        year: r.movie.year,
        watchedYear: r.movie.watchedYear,
        rating: r.rating
      })),
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRankings: rankings.length
    }
  }

  const compareUsers = async () => {
    if (!selectedUser1 || !selectedUser2) {
      alert('Please select two users to compare')
      return
    }

    if (selectedUser1 === selectedUser2) {
      alert('Please select two different users to compare')
      return
    }

    setIsLoading(true)
    try {
      const [data1, data2] = await Promise.all([
        fetchUserRankings(selectedUser1),
        fetchUserRankings(selectedUser2)
      ])

      setUser1Data(data1)
      setUser2Data(data2)

      // Find common movies
      const user1Movies = new Map(data1.rankings.map(r => [r.movieId, r]))
      const user2Movies = new Map(data2.rankings.map(r => [r.movieId, r]))
      
      const common: Array<{
        movieId: string
        title: string
        year: number
        watchedYear: number
        rating1: number
        rating2: number
        difference: number
      }> = []

      user1Movies.forEach((rating1, movieId) => {
        const rating2 = user2Movies.get(movieId)
        if (rating2) {
          common.push({
            movieId,
            title: rating1.title,
            year: rating1.year,
            watchedYear: rating1.watchedYear,
            rating1: rating1.rating,
            rating2: rating2.rating,
            difference: Math.abs(rating1.rating - rating2.rating)
          })
        }
      })

      // Sort by difference (largest differences first)
      common.sort((a, b) => b.difference - a.difference)
      setCommonMovies(common)

    } catch (error) {
      console.error('Failed to compare users:', error)
      alert('Failed to compare users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetComparison = () => {
    setSelectedUser1('')
    setSelectedUser2('')
    setUser1Data(null)
    setUser2Data(null)
    setCommonMovies([])
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifferenceColor = (difference: number) => {
    if (difference >= 4) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (difference >= 2) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        resetComparison()
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Compare Users
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare User Rankings</DialogTitle>
          <DialogDescription>
            Select two users to compare their movie ratings side by side
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First User</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedUser1}
                onChange={(e) => setSelectedUser1(e.target.value)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Second User</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedUser2}
                onChange={(e) => setSelectedUser2(e.target.value)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedUser1 && selectedUser2 && (
            <Button 
              onClick={compareUsers} 
              disabled={isLoading || selectedUser1 === selectedUser2}
              className="w-full"
            >
              {isLoading ? 'Comparing...' : 'Compare Rankings'}
            </Button>
          )}

          {/* Comparison results */}
          {user1Data && user2Data && (
            <div className="space-y-6">
              {/* User stats comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-3">
                       <img 
                         src={getUserAvatar(user1Data.user)} 
                         alt={user1Data.user.displayName}
                         className="h-10 w-10 rounded-full border border-blue-200 dark:border-blue-800 object-cover"
                       />
                       <div>
                         <h3 className="font-semibold">{user1Data.user.displayName}</h3>
                         <p className="text-sm text-muted-foreground">@{user1Data.user.username}</p>
                       </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="text-xl font-bold">{user1Data.totalRankings}</div>
                          <div className="text-xs text-muted-foreground">Rankings</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                        <div>
                          <div className="text-xl font-bold">{user1Data.averageRating}</div>
                          <div className="text-xs text-muted-foreground">Avg Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-3">
                       <img 
                         src={getUserAvatar(user2Data.user)} 
                         alt={user2Data.user.displayName}
                         className="h-10 w-10 rounded-full border border-green-200 dark:border-green-800 object-cover"
                       />
                       <div>
                         <h3 className="font-semibold">{user2Data.user.displayName}</h3>
                         <p className="text-sm text-muted-foreground">@{user2Data.user.username}</p>
                       </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="text-xl font-bold">{user2Data.totalRankings}</div>
                          <div className="text-xs text-muted-foreground">Rankings</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                        <div>
                          <div className="text-xl font-bold">{user2Data.averageRating}</div>
                          <div className="text-xs text-muted-foreground">Avg Rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Common movies comparison */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Common Movies</h3>
                  <div className="text-sm text-muted-foreground">
                    {commonMovies.length} movies rated by both users
                  </div>
                </div>

                {commonMovies.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold">No Common Movies</h4>
                    <p className="text-muted-foreground mt-2">
                      These users haven't rated any of the same movies
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commonMovies.map((movie) => (
                      <div key={movie.movieId} className="p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">{movie.title}</h4>
                              <span className="text-sm text-muted-foreground">
                                ({movie.year} • Watched: {movie.watchedYear})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            {/* User 1 rating */}
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(movie.rating1)}`}>
                                {movie.rating1}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user1Data.user.displayName.split(' ')[0]}
                              </div>
                            </div>
                            
                            {/* Difference */}
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifferenceColor(movie.difference)}`}>
                              {movie.difference.toFixed(1)} diff
                            </div>
                            
                            {/* User 2 rating */}
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(movie.rating2)}`}>
                                {movie.rating2}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user2Data.user.displayName.split(' ')[0]}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary statistics */}
              {commonMovies.length > 0 && (
                <Card className="p-4 border">
                  <h3 className="font-semibold mb-4">Comparison Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Average Difference</div>
                      <div className="text-xl font-bold">
                        {(commonMovies.reduce((sum, m) => sum + m.difference, 0) / commonMovies.length).toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Largest Difference</div>
                      <div className="text-xl font-bold text-red-600">
                        {Math.max(...commonMovies.map(m => m.difference)).toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Smallest Difference</div>
                      <div className="text-xl font-bold text-green-600">
                        {Math.min(...commonMovies.map(m => m.difference)).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
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

// Card component for styling
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
)