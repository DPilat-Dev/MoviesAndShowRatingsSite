import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Film } from 'lucide-react'
import { userApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setIsLoading(true)
    
    try {
      // Create or get user
      const response = await userApi.createUser({
        username,
        displayName: displayName || username,
      })
      
      const user = response.data
      
      // Use UserContext login function
      login({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isNew: !displayName,
      })
      
      navigate('/')
    } catch (error: unknown) {
      console.error('Login error:', error)
      
      // If user already exists (409), we can still "login" with that username
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } }
        
        if (axiosError.response?.status === 409) {
        // Create a temporary user object - the real data will be fetched by UserContext
        const tempUser = {
          id: `temp-${username}`, // Temporary ID, will be replaced with real user data
          username,
          displayName: displayName || username,
        }
        
        // Use UserContext login function (it will fetch real user data)
        login(tempUser)
        navigate('/')
      } else if (axiosError.response?.data?.error) {
        setError(axiosError.response.data.error)
      } else {
        setError('Login failed. Please try again.')
      }
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Film className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Bosnia Movie Rankings</CardTitle>
          <CardDescription className="text-center">
            Enter your username to join the movie ranking community
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="How you want to be displayed"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to use your username
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Join Ranking Community'}
            </Button>
          </CardFooter>
        </form>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            No password required! Your username is your identity.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            You can rate movies, see rankings, and contribute to the community.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}