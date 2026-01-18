import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, CheckCircle, AlertCircle } from 'lucide-react'
import { userApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

export default function Profile() {
  const { user, updateUser } = useUser()
  const navigate = useNavigate()
  
  const [username, setUsername] = useState(user?.username || '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if not logged in
  if (!user) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validation
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    
    if (!displayName.trim()) {
      setError('Please enter a display name')
      return
    }
    
    // Check if anything changed
    if (username === user.username && displayName === user.displayName) {
      setError('No changes to save')
      return
    }

    setIsLoading(true)
    
    try {
      // Prepare update data
      const updateData: any = {}
      
      if (username !== user.username) {
        updateData.username = username
      }
      
      if (displayName !== user.displayName) {
        updateData.displayName = displayName
      }
      
      // Call API to update user
      const response = await userApi.updateUser(user.id, updateData)
      
      // Update local context and storage
      updateUser({
        username: response.data.username,
        displayName: response.data.displayName
      })
      
      setSuccess('Profile updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
      }, 3000)
      
    } catch (error: unknown) {
      console.error('Profile update error:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        setError(axiosError.response?.data?.error || 'Failed to update profile')
      } else {
        setError('Failed to update profile. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to current user data
    setUsername(user.username)
    setDisplayName(user.displayName)
    setError('')
    setSuccess('')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your username and display name
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Success message */}
            {success && (
              <div className="p-4 mb-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-green-800 dark:text-green-300">{success}</span>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="p-4 mb-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-red-800 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}
            
            {/* Current user info */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Current Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <p className="font-mono text-xs truncate">{user.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Username:</span>
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
            </div>
            
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                Username must be 3-50 characters and can only contain letters, numbers, and underscores.
                {username !== user.username && (
                  <span className="text-amber-600 dark:text-amber-400 ml-2">
                    Changing your username may affect how others mention you.
                  </span>
                )}
              </p>
            </div>
            
            {/* Display name field */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
                minLength={1}
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                This is the name that will be shown to other users.
              </p>
            </div>
            
            {/* Change indicators */}
            {(username !== user.username || displayName !== user.displayName) && (
              <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Changes to be saved:</h4>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                  {username !== user.username && (
                    <li>• Username: {user.username} → {username}</li>
                  )}
                  {displayName !== user.displayName && (
                    <li>• Display Name: {user.displayName} → {displayName}</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading || (username === user.username && displayName === user.displayName)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (username === user.username && displayName === user.displayName)}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Important notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Your username must be unique. If someone else is already using your desired username, you'll need to choose a different one.</p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Changing your username may affect how other users mention or search for you.</p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Your display name is how you appear to others in the community. You can change this as often as you like.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}