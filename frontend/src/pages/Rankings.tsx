import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Star, TrendingUp, Calendar, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { rankingApi } from '@/lib/api'
import { ViewMovieRatingsModal } from '@/components/ViewMovieRatingsModal'

interface YearlyStats {
  year: number
  avgRating: number
  movies: number
  rankings: number
}

interface TopMovie {
  id: string
  title: string
  year: number
  watchedYear: number
  avgRating: number
  ratings: number
}

interface UserActivity {
  id: string
  name: string
  rankings: number
  avgRating: number
}

interface YearlyStatResponse {
  year: number
  totalRankings: number
  averageRating: number
  uniqueUsers: number
  uniqueMovies: number
}

interface ApiTopMovie {
  id: string
  title: string
  year: number
  watchedYear: number
  averageRating: number
  totalRankings: number
}

interface ApiRanking {
  id: string
  rating: number
  rankedAt: string
  description?: string
  movie: {
    id: string
    title: string
    year: number
    watchedYear: number
  }
  user: {
    id: string
    username: string
    displayName: string
  }
}

interface ApiActiveUser {
  id: string
  username: string
  displayName: string
  totalRankings: number
  averageRating: number
}

export default function Rankings() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [yearlyData, setYearlyData] = useState<YearlyStats[]>([])
  const [topMovies, setTopMovies] = useState<TopMovie[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRankingsData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch yearly stats
      const yearlyStatsResponse = await rankingApi.getYearlyStats()
      const statsData = yearlyStatsResponse.data.yearlyStats || []
      
      // Format yearly data for chart
      const formattedYearlyData = statsData.map((stat: YearlyStatResponse) => ({
        year: stat.year,
        avgRating: stat.averageRating || 0,
        movies: stat.uniqueMovies || 0,
        rankings: stat.totalRankings || 0
      }))
      setYearlyData(formattedYearlyData)

      // Get available years with data
      const yearsWithData = statsData
        .filter((stat: YearlyStatResponse) => stat.totalRankings > 0)
        .map((stat: YearlyStatResponse) => stat.year)
        .sort((a: number, b: number) => b - a) // Sort descending
      
      // If no years with data, use current year
      if (yearsWithData.length === 0) {
        setAvailableYears([currentYear])
      } else {
        setAvailableYears(yearsWithData)
        // If selected year is not in available years, set to first available year
        if (!yearsWithData.includes(selectedYear)) {
          setSelectedYear(yearsWithData[0])
          return // Will re-fetch with new selected year
        }
      }

      // Fetch rankings for selected year
      const rankingsResponse = await rankingApi.getRankingsByYear(selectedYear, { limit: 50 })
      
      // Use topMovies from API response if available
      if (rankingsResponse.data.topMovies && rankingsResponse.data.topMovies.length > 0) {
        const apiTopMovies = rankingsResponse.data.topMovies.slice(0, 5).map((movie: ApiTopMovie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          watchedYear: movie.watchedYear,
          avgRating: movie.averageRating || 0,
          ratings: movie.totalRankings || 0
        }))
        setTopMovies(apiTopMovies)
      } else {
        // Fallback to calculation if API doesn't return topMovies
        const rankings = rankingsResponse.data.data || []
        const movieRatings: Record<string, { sum: number; count: number; title: string; year: number; watchedYear: number }> = {}
        
        rankings.forEach((ranking: ApiRanking) => {
          if (ranking.movie) {
            const movieId = ranking.movie.id
            if (!movieRatings[movieId]) {
              movieRatings[movieId] = {
                sum: 0,
                count: 0,
                title: ranking.movie.title,
                year: ranking.movie.year,
                watchedYear: ranking.movie.watchedYear
              }
            }
            movieRatings[movieId].sum += ranking.rating
            movieRatings[movieId].count += 1
          }
        })

         const calculatedTopMovies = Object.entries(movieRatings)
           .map(([id, data]) => ({
             id,
             title: data.title,
             year: data.year,
             watchedYear: data.watchedYear,
             avgRating: data.sum / data.count,
             ratings: data.count
           }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 5)
        
        setTopMovies(calculatedTopMovies)
      }

      // Calculate user activity from activeUsers in API response if available
      if (rankingsResponse.data.activeUsers && rankingsResponse.data.activeUsers.length > 0) {
        const apiUserActivity = rankingsResponse.data.activeUsers.slice(0, 5).map((user: ApiActiveUser) => ({
          id: user.id,
          name: user.displayName || user.username,
          rankings: user.totalRankings || 0,
          avgRating: user.averageRating || 0
        }))
        setUserActivity(apiUserActivity)
      } else {
        // Fallback to calculation
        const rankings = rankingsResponse.data.data || []
        const userRatings: Record<string, { sum: number; count: number; name: string }> = {}
        
        rankings.forEach((ranking: ApiRanking) => {
          if (ranking.user) {
            const userId = ranking.user.id
            if (!userRatings[userId]) {
              userRatings[userId] = {
                sum: 0,
                count: 0,
                name: ranking.user.displayName || ranking.user.username
              }
            }
            userRatings[userId].sum += ranking.rating
            userRatings[userId].count += 1
          }
        })

        const calculatedUserActivity = Object.entries(userRatings)
          .map(([id, data]) => ({
            id,
            name: data.name,
            rankings: data.count,
            avgRating: data.sum / data.count
          }))
          .sort((a, b) => b.rankings - a.rankings)
          .slice(0, 5)
        
        setUserActivity(calculatedUserActivity)
      }
    } catch (error) {
      console.error('Failed to fetch rankings data:', error)
      // Set empty arrays on error
      setYearlyData([])
      setTopMovies([])
      setUserActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear, currentYear])

  useEffect(() => {
    fetchRankingsData()
  }, [selectedYear, fetchRankingsData])
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground">
            View and analyze movie rankings by year
          </p>
        </div>
         <div className="flex items-center gap-4">
           <div className="relative w-[180px]">
             <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-10" />
              <Select 
                value={selectedYear.toString()} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="pl-10"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </Select>
           </div>
           <Button onClick={() => window.open(`/api/data/export?year=${selectedYear}`, '_blank')}>
             Export Data
           </Button>
         </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading rankings data...</p>
        </div>
      ) : (
        <>
          {/* Yearly comparison chart */}
          {yearlyData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Yearly Ranking Trends</CardTitle>
                <CardDescription>
                  Average ratings and activity by year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="avgRating" name="Avg Rating" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="rankings" name="Total Rankings" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Yearly Ranking Trends</CardTitle>
                <CardDescription>
                  No ranking data available yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Start adding rankings to see yearly trends</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Top movies ranking */}
            <Card>
              <CardHeader>
                <CardTitle>Top Movies of {selectedYear}</CardTitle>
                <CardDescription>
                  {topMovies.length > 0 ? 'Highest rated movies this year' : 'No rankings yet for this year'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topMovies.length > 0 ? (
                   <div className="space-y-4">
                     {topMovies.map((movie, index) => (
                       <ViewMovieRatingsModal
                         key={movie.id}
                         movie={{
                           id: movie.id,
                           title: movie.title,
                           year: movie.year,
                           watchedYear: movie.watchedYear
                         }}
                         trigger={
                           <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                             <div className="flex items-center space-x-4">
                               <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                                 <span className="font-bold">{index + 1}</span>
                               </div>
                               <div className="flex-1">
                                 <p className="font-medium">{movie.title}</p>
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <Calendar className="h-3 w-3" />
                                   <span>{movie.year}</span>
                                   <Users className="h-3 w-3 ml-2" />
                                   <span>{movie.ratings} rating{movie.ratings !== 1 ? 's' : ''}</span>
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center">
                               <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                               <span className="font-bold">{movie.avgRating.toFixed(1)}</span>
                               <span className="text-sm text-muted-foreground ml-1">/10</span>
                             </div>
                           </div>
                         }
                       />
                     ))}
                   </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No movie rankings for {selectedYear} yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User rankings */}
            <Card>
              <CardHeader>
                <CardTitle>User Ranking Activity</CardTitle>
                <CardDescription>
                  {userActivity.length > 0 ? 'Most active users this year' : 'No user activity yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userActivity.length > 0 ? (
                  <div className="space-y-4">
                    {userActivity.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span>{user.rankings} ranking{user.rankings !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="font-bold">{user.avgRating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground ml-1">avg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No user rankings for {selectedYear} yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rating distribution - Removed for now since it requires more complex data aggregation */}
          {/* We can add this back when we have proper rating distribution data */}
        </>
      )}
    </div>
  )
}