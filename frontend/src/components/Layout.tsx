import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Film, Home, Star, Users, LogOut, User, Settings } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { DarkModeToggle } from './DarkModeToggle'
import { getUserAvatar } from '@/utils/avatarUtils'

export default function Layout() {
  const { user, logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <Film className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Bosnia Movie Rankings</span>
              </Link>
              <div className="hidden md:flex items-center space-x-2">
                <img 
                  src={getUserAvatar(user)} 
                  alt={user.displayName}
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
                <div>
                  <div className="text-sm text-muted-foreground">Welcome back,</div>
                  <div className="font-medium">{user.displayName}</div>
                </div>
              </div>
              {/* Mobile user info */}
              <div className="md:hidden flex items-center">
                <img 
                  src={getUserAvatar(user)} 
                  alt={user.displayName}
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
              </div>
            </div>
             <div className="flex items-center gap-2">
               <DarkModeToggle />
               <Button variant="ghost" size="sm" onClick={handleLogout}>
                 <LogOut className="h-4 w-4 mr-2" />
                 Logout
               </Button>
             </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <nav className="space-y-2">
              <Link to="/">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/movies">
                <Button variant="ghost" className="w-full justify-start">
                  <Film className="h-4 w-4 mr-2" />
                  Movies
                </Button>
              </Link>
               <Link to="/rankings">
                 <Button variant="ghost" className="w-full justify-start">
                   <Star className="h-4 w-4 mr-2" />
                   Global Rankings
                 </Button>
               </Link>
               <Link to="/my-rankings">
                 <Button variant="ghost" className="w-full justify-start">
                   <User className="h-4 w-4 mr-2" />
                   My Rankings
                 </Button>
               </Link>
                <Link to="/users">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
             </nav>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Current Year</h3>
              <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Rankings are organized by year
              </p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}