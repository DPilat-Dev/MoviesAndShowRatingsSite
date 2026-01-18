import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users as UsersIcon, Search, Star, Calendar, TrendingUp, GitCompare, Eye } from 'lucide-react'
import { userApi } from '@/lib/api'
import { CompareUsersModal } from '@/components/CompareUsersModal'
import { ViewUserRatingsModal } from '@/components/ViewUserRatingsModal'

interface User {
  id: string
  username: string
  displayName: string
  isActive: boolean
  createdAt: string
  _count?: {
    rankings: number
  }
  totalRankings?: number
  averageRating?: number
}



export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getUsers({
        search: search || undefined
      })
      const usersData = response.data.data || []
      
      // Fetch stats for each user to get average ratings
      const usersWithStats = await Promise.all(
        usersData.map(async (user: User) => {
          try {
            const statsResponse = await userApi.getUserStats(user.id)
            return {
              ...user,
              averageRating: statsResponse.data.averageRating || 0
            }
          } catch (error) {
            console.error(`Failed to fetch stats for user ${user.id}:`, error)
            return {
              ...user,
              averageRating: 0
            }
          }
        })
      )
      
      setUsers(usersWithStats)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Community members and their ranking activity
          </p>
        </div>
        <CompareUsersModal users={users} />
      </div>

      {/* Search and filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search users..."
                   className="pl-10"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                 />
               </div>
             </div>
             <Button onClick={fetchUsers} variant="outline">
               Search
             </Button>
            <div className="flex gap-2">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Sort by</option>
                <option value="rankings">Most Active</option>
                <option value="rating">Highest Rated</option>
                <option value="joined">Newest</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

       {/* Users grid */}
       {isLoading ? (
         <div className="text-center py-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
           <p className="mt-4 text-muted-foreground">Loading users...</p>
         </div>
       ) : users.length === 0 ? (
         <div className="text-center py-12 border rounded-lg">
           <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
           <h3 className="text-lg font-semibold">No users found</h3>
           <p className="text-muted-foreground mt-2">
             {search ? 'Try changing your search' : 'No users in the system yet'}
           </p>
         </div>
       ) : (
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {users.map((user) => (
             <Card key={user.id} className="hover:shadow-lg transition-shadow">
               <CardHeader className="pb-3">
                 <div className="flex items-center space-x-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                     <span className="font-bold text-lg">{user.displayName.charAt(0)}</span>
                   </div>
                   <div>
                     <CardTitle className="text-lg">{user.displayName}</CardTitle>
                     <CardDescription>@{user.username}</CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center text-sm text-muted-foreground">
                       <Calendar className="h-3 w-3 mr-1" />
                       Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 rounded-lg bg-muted">
                       <div className="flex items-center">
                         <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                         <div>
                           <div className="text-2xl font-bold">{user._count?.rankings || user.totalRankings || 0}</div>
                           <div className="text-xs text-muted-foreground">Rankings</div>
                         </div>
                       </div>
                     </div>
                     
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                          <div>
                            <div className="text-2xl font-bold">
                              {user.averageRating ? user.averageRating.toFixed(1) : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Rating</div>
                          </div>
                        </div>
                      </div>
                   </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <span className="text-muted-foreground mr-2">Status</span>
                          <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <ViewUserRatingsModal 
                            user={user}
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8">
                                <Eye className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <CompareUsersModal 
                            users={users}
                            initialUser={user.id}
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8">
                                <GitCompare className="h-3 w-3" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       )}

      {/* Community stats */}
      <Card>
        <CardHeader>
          <CardTitle>Community Statistics</CardTitle>
          <CardDescription>
            Overview of user activity and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
           <div className="space-y-2">
             <div className="text-2xl font-bold">{users.length}</div>
             <div className="text-sm text-muted-foreground">Total Users</div>
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
             </div>
           </div>
           
           <div className="space-y-2">
             <div className="text-2xl font-bold">
               {users.reduce((sum, user) => sum + (user._count?.rankings || user.totalRankings || 0), 0)}
             </div>
             <div className="text-sm text-muted-foreground">Total Rankings</div>
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
             </div>
           </div>
           
           <div className="space-y-2">
             <div className="text-2xl font-bold">
               {users.filter(u => u.isActive).length}
             </div>
             <div className="text-sm text-muted-foreground">Active Users</div>
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(users.filter(u => u.isActive).length / Math.max(users.length, 1)) * 100}%` }} />
             </div>
           </div>
            
             <div className="space-y-2">
               <div className="text-2xl font-bold">
                 {users.filter(u => u.isActive).length}
               </div>
               <div className="text-sm text-muted-foreground">Active This Month</div>
               <div className="h-2 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(users.filter(u => u.isActive).length / Math.max(users.length, 1)) * 100}%` }} />
               </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}