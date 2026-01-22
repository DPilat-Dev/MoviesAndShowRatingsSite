import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Film, Star, Users, TrendingUp, Calendar } from 'lucide-react'
import { movieApi, rankingApi, userApi } from '@/lib/api'
import { ViewMovieRatingsModal } from '@/components/ViewMovieRatingsModal'
import { useCallback } from 'react'
import { getUserAvatar } from '@/utils/avatarUtils'
import { DashboardSkeleton } from '@/components/Skeleton'
import { omdbService } from '@/services/omdbService'

interface DashboardStats {
  totalMovies: number
  averageRating: number
  activeUsers: number
  rankingsThisYear: number
}

interface TopMovie {
  id: string
  title: string
  year: number
  watchedYear: number
  posterUrl?: string | null
  averageRating: number
  totalRankings: number
}

interface UnratedMovie {
  id: string
  title: string
  year: number
  watchedYear: number
  posterUrl?: string | null
}

interface RecentActivity {
  id: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
  movie: {
    id: string
    title: string
    year: number
    watchedYear: number
  }
  rating: number
  rankedAt: string
}

interface YearlyStat {
  year: number
  totalRankings: number
  averageRating: number
  uniqueUsers: number
  uniqueMovies: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topMovies, setTopMovies] = useState<TopMovie[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [unratedMovies, setUnratedMovies] = useState<UnratedMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
       // Fetch data in parallel
       const [moviesRes, yearlyStatsRes, yearlyOverviewRes, unratedRes] = await Promise.all([
         movieApi.getMovies({ limit: 1 }), // Just to get total count
         rankingApi.getRankingsByYear(selectedYear, { limit: 10 }),
         rankingApi.getYearlyStats(), // Get all years with data
         movieApi.getUnratedMovies(selectedYear), // Get unrated movies for logged-in user
       ])

       // Get users count (simplified - in real app would have user stats endpoint)
       const usersRes = await userApi.getUsers({ limit: 1 })

       // Calculate stats
       const totalMovies = moviesRes.data.pagination?.total || 0
       const rankingsThisYear = yearlyStatsRes.data.stats?.totalRankings || 0
       const activeUsers = usersRes.data.pagination?.total || 0
       
       // Calculate average rating from yearly stats
       const averageRating = yearlyStatsRes.data.stats?.averageRating || 0

      setStats({
        totalMovies,
        averageRating,
        activeUsers,
        rankingsThisYear,
      })

      // Set top movies from yearly stats
      if (yearlyStatsRes.data.topMovies) {
        setTopMovies(yearlyStatsRes.data.topMovies.slice(0, 5))
      }

       // Set recent activity
      if (yearlyStatsRes.data.data) {
        setRecentActivity(yearlyStatsRes.data.data.slice(0, 5))
      }

      // Set unrated movies
      if (unratedRes.data.movies) {
        setUnratedMovies(unratedRes.data.movies.slice(0, 5))
      }

      // Set available years from yearly overview
      const yearsWithData = yearlyOverviewRes.data.yearlyStats
        .filter((stat: YearlyStat) => stat.totalRankings > 0)
        .map((stat: YearlyStat) => stat.year)
        .sort((a: number, b: number) => b - a) // Sort descending
      
      // If no years with data, use current year
      if (yearsWithData.length === 0) {
        setAvailableYears([new Date().getFullYear()])
      } else {
        setAvailableYears(yearsWithData)
        // If selected year is not in available years, set to first available year
        if (!yearsWithData.includes(selectedYear)) {
          setSelectedYear(yearsWithData[0])
        }
       }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to current year if API fails
      setAvailableYears([new Date().getFullYear()])
      setStats({
        totalMovies: 0,
        averageRating: 0,
        activeUsers: 0,
        rankingsThisYear: 0,
      })
      setTopMovies([])
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchDashboardData()
  }, [selectedYear, fetchDashboardData])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of movie rankings and statistics
        </p>
      </div>

       {/* Year selector */}
       <div className="flex flex-wrap gap-2">
         {availableYears.map((year) => (
           <Button
             key={year}
             variant={year === selectedYear ? 'default' : 'outline'}
             size="sm"
             onClick={() => setSelectedYear(year)}
           >
             <Calendar className="h-4 w-4 mr-2" />
             {year}
           </Button>
         ))}
       </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMovies || 0}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageRating.toFixed(1) || '0.0'}</div>
            <p className="text-xs text-muted-foreground">
              Out of 10 points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rankings This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rankingsThisYear || 0}</div>
            <p className="text-xs text-muted-foreground">
              In {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top movies and activity section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Movies of {selectedYear}</CardTitle>
            <CardDescription>
              Highest rated movies this year
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                         <img 
                           src={movie.posterUrl || omdbService.getPlaceholderPoster()} 
                           alt={movie.title}
                           className="h-12 w-8 object-cover rounded"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = omdbService.getPlaceholderPoster()
                           }}
                         />
                         <div>
                           <p className="font-medium">{movie.title}</p>
                           <p className="text-sm text-muted-foreground">
                             {movie.year} • Watched: {movie.watchedYear}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center">
                         <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                         <span className="font-bold">{movie.averageRating.toFixed(1)}</span>
                       </div>
                     </div>
                   }
                 />
               ))}
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest rankings and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                 <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted">
                   <img 
                     src={getUserAvatar(activity.user)} 
                     alt={activity.user.displayName}
                     className="h-8 w-8 rounded-full border border-border object-cover"
                   />
                   <div className="flex-1">
                     <p className="text-sm">
                       <span className="font-medium">{activity.user.displayName}</span> rated{' '}
                       <span className="font-medium">"{activity.movie.title}"</span> with{' '}
                       <span className="font-bold">{activity.rating}/10</span>
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {new Date(activity.rankedAt).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unrated movies section */}
      <Card>
        <CardHeader>
          <CardTitle>Unrated Movies of {selectedYear}</CardTitle>
          <CardDescription>
            Movies from {selectedYear} that haven't been rated yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {unratedMovies.map((movie) => (
              <div key={movie.id} className="flex flex-col items-center space-y-3 p-4 rounded-lg border hover:bg-muted">
                <img 
                  src={movie.posterUrl || omdbService.getPlaceholderPoster()} 
                  alt={movie.title}
                  className="h-48 w-32 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = omdbService.getPlaceholderPoster()
                  }}
                />
                <div className="text-center">
                  <p className="font-medium text-sm line-clamp-2">{movie.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {movie.year}
                  </p>
                </div>
                <Button size="sm" className="w-full">
                  Rate
                </Button>
              </div>
            ))}
          </div>
          {unratedMovies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">All movies from {selectedYear} have been rated!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}