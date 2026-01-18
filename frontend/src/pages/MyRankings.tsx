import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Calendar, Film, Trash2, Edit } from 'lucide-react'
import { rankingApi } from '@/lib/api'
import { generateYears } from '@/lib/utils'

interface Ranking {
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

export default function MyRankings() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingRating, setEditingRating] = useState<string | null>(null)
  const [newRating, setNewRating] = useState(0)
  const [newDescription, setNewDescription] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [years, setYears] = useState<number[]>([])
  const [isYearsLoading, setIsYearsLoading] = useState(true)

  const fetchMyRankings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get current user from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user logged in')
        return
      }
      
      const user = JSON.parse(userStr)
      
      // Fetch rankings for current user
      const response = await rankingApi.getRankings({
        userId: user.id,
        watchedYear: selectedYear
      })
      
      setRankings(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch my rankings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear])

  const fetchUserWatchedYears = useCallback(async () => {
    try {
      setIsYearsLoading(true)
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('No user logged in')
        setYears(generateYears())
        return
      }
      
      const user = JSON.parse(userStr)
      
      // Get all user rankings to extract watched years
      const response = await rankingApi.getRankings({
        userId: user.id,
        limit: 1000 // Get all rankings to find all watched years
      })
      
      // Extract unique watched years from rankings
      const watchedYears = new Set<number>()
      response.data.data?.forEach((ranking: Ranking) => {
        if (ranking.movie?.watchedYear) {
          watchedYears.add(ranking.movie.watchedYear)
        }
      })
      
      // Convert to array and sort descending
      const yearsArray = Array.from(watchedYears).sort((a, b) => b - a)
      
      // If no years found, use generated years
      if (yearsArray.length === 0) {
        setYears(generateYears())
      } else {
        setYears(yearsArray)
        // Set selected year to most recent year if not already set
        if (!yearsArray.includes(selectedYear)) {
          setSelectedYear(yearsArray[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch user watched years:', error)
      // Fallback to generated years
      setYears(generateYears())
    } finally {
      setIsYearsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchUserWatchedYears()
    fetchMyRankings()
  }, [selectedYear, fetchMyRankings, fetchUserWatchedYears])
  const handleDeleteRanking = async (rankingId: string) => {
    if (!confirm('Are you sure you want to delete this rating?')) {
      return
    }
    
    try {
      await rankingApi.deleteRanking(rankingId)
      fetchMyRankings() // Refresh the list
    } catch (error) {
      console.error('Failed to delete ranking:', error)
      alert('Failed to delete rating. Please try again.')
    }
  }

  const handleUpdateRating = async (rankingId: string) => {
    if (newRating === 0) {
      alert('Please select a rating')
      return
    }
    
    try {
      await rankingApi.updateRanking(rankingId, { 
        rating: newRating,
        description: newDescription.trim() || undefined 
      })
      setEditingRating(null)
      setNewRating(0)
      setNewDescription('')
      fetchMyRankings() // Refresh the list
    } catch (error) {
      console.error('Failed to update rating:', error)
      alert('Failed to update rating. Please try again.')
    }
  }

  const startEditing = (ranking: Ranking) => {
    setEditingRating(ranking.id)
    setNewRating(ranking.rating)
    setNewDescription(ranking.description || '')
  }

  const cancelEditing = () => {
    setEditingRating(null)
    setNewRating(0)
    setNewDescription('')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Rankings</h1>
          <p className="text-muted-foreground">
            View and manage your movie ratings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isYearsLoading ? (
            <div className="h-10 w-32 bg-muted rounded-md animate-pulse"></div>
          ) : (
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Rankings list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No rankings found</h3>
          <p className="text-muted-foreground mt-2">
            {selectedYear === new Date().getFullYear() 
              ? "You haven't rated any movies this year. Start rating movies from the Movies page!"
              : `You didn't rate any movies in ${selectedYear}.`}
          </p>
          <Button className="mt-4" onClick={() => window.location.href = '/movies'}>
            Browse Movies
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rankings.map((ranking) => (
            <Card key={ranking.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center rounded">
                        <Film className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{ranking.movie.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{ranking.movie.year} • Watched: {ranking.movie.watchedYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     {editingRating === ranking.id ? (
                       <div className="flex flex-col items-end gap-2 w-full max-w-md">
                         <div className="flex gap-1 mb-2">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                             <button
                               key={star}
                               type="button"
                               className="p-1"
                               onClick={() => setNewRating(star)}
                               onMouseEnter={() => setHoverRating(star)}
                               onMouseLeave={() => setHoverRating(0)}
                             >
                               <Star
                                 className={`h-5 w-5 ${
                                   star <= (hoverRating || newRating)
                                     ? 'text-yellow-500 fill-yellow-500'
                                     : 'text-gray-300'
                                 }`}
                               />
                             </button>
                           ))}
                         </div>
                         
                         {/* Description textarea for editing */}
                         <div className="w-full mb-2">
                           <label className="block text-sm font-medium mb-1">
                             Comment
                             <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
                           </label>
                           <Textarea
                             placeholder="Update your comment about this movie..."
                             value={newDescription}
                             onChange={(e) => setNewDescription(e.target.value)}
                             className="min-h-[60px] w-full"
                             maxLength={500}
                           />
                           <div className="text-xs text-muted-foreground mt-1 text-right">
                             {newDescription.length}/500 characters
                           </div>
                         </div>
                         
                         <div className="flex gap-2">
                           <Button size="sm" variant="outline" onClick={cancelEditing}>
                             Cancel
                           </Button>
                           <Button size="sm" onClick={() => handleUpdateRating(ranking.id)}>
                             Save
                           </Button>
                         </div>
                       </div>
                     ) : (
                      <>
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="text-xl font-bold">{ranking.rating}/10</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(ranking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRanking(ranking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4">
                  Rated on {new Date(ranking.rankedAt).toLocaleDateString()}
                </div>
                
                {/* Description if exists */}
                {ranking.description && (
                  <div className="mt-3 ml-12">
                    <div className="text-sm text-muted-foreground italic">"{ranking.description}"</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats card */}
      <Card>
        <CardHeader>
          <CardTitle>My Ranking Stats</CardTitle>
          <CardDescription>
            Summary of your ratings for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{rankings.length}</div>
              <div className="text-sm text-muted-foreground">Total Ratings</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {rankings.length > 0 
                  ? (rankings.reduce((sum, r) => sum + r.rating, 0) / rankings.length).toFixed(1)
                  : '0.0'}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="flex items-center mt-2">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="text-sm">out of 10</span>
              </div>
            </div>
            {rankings.length > 0 && (
              <>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.min(...rankings.map(r => r.rating))}
                  </div>
                  <div className="text-sm text-muted-foreground">Lowest Rating</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {Math.max(...rankings.map(r => r.rating))}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Rating</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}