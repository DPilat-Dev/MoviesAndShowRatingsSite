import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, CheckCircle, AlertCircle, Upload, Image, X, ExternalLink } from 'lucide-react'
import { userApi } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'
import { getUserAvatar, isValidAvatarUrl } from '@/utils/avatarUtils'

export default function Profile() {
  const { user, updateUser } = useUser()
  const navigate = useNavigate()
  
  const [username, setUsername] = useState(user?.username || '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(getUserAvatar({ username: user?.username || '', avatarUrl: user?.avatarUrl }))
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    // Validate avatar URL if provided
    if (avatarUrl.trim() !== '' && !isValidAvatarUrl(avatarUrl)) {
      setError('Please enter a valid image URL from a supported service (DiceBear, GitHub, Gravatar, Imgur, Unsplash, etc.)')
      return
    }
    
    // Check if anything changed
    if (username === user.username && displayName === user.displayName && avatarUrl === (user.avatarUrl || '')) {
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
      
      if (avatarUrl !== (user.avatarUrl || '')) {
        updateData.avatarUrl = avatarUrl.trim() === '' ? null : avatarUrl
      }
      
      // Call API to update user
      const response = await userApi.updateUser(user.id, updateData)
      
      // Update local context and storage
      updateUser({
        username: response.data.username,
        displayName: response.data.displayName,
        avatarUrl: response.data.avatarUrl
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
    setAvatarUrl(user.avatarUrl || '')
    setAvatarPreview(getUserAvatar({ username: user.username, avatarUrl: user.avatarUrl }))
    setError('')
    setSuccess('')
  }

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url)
    if (url.trim() === '') {
      setAvatarPreview(getUserAvatar({ username, avatarUrl: '' }))
    } else if (isValidAvatarUrl(url)) {
      setAvatarPreview(url)
    }
  }

  const handleClearAvatar = () => {
    setAvatarUrl('')
    setAvatarPreview(getUserAvatar({ username, avatarUrl: '' }))
  }

  const handleUseDefaultAvatar = () => {
    setAvatarUrl('')
    setAvatarPreview(getUserAvatar({ username, avatarUrl: '' }))
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF, etc.)')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setAvatarUrl('') // Clear URL field when using file upload
    
    // Note: In a real app, you would upload the file to a server
    // For now, we'll just show a message
    setError('File upload requires server implementation. Please use an image URL instead.')
    
    // Clean up object URL
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={avatarPreview} 
                alt="Profile preview" 
                className="h-12 w-12 rounded-full border-2 border-primary object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <User className="h-3 w-3" />
              </div>
            </div>
            <div>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and avatar
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
                <div className="col-span-2">
                  <span className="text-muted-foreground">Current Avatar:</span>
                  <div className="flex items-center space-x-3 mt-1">
                    <img 
                      src={getUserAvatar({ username: user.username, avatarUrl: user.avatarUrl })} 
                      alt="Current avatar" 
                      className="h-10 w-10 rounded-full border border-border object-cover"
                    />
                    <div className="text-sm">
                      {user.avatarUrl ? (
                        <a 
                          href={user.avatarUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          Custom avatar <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Default avatar</span>
                      )}
                    </div>
                  </div>
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

            {/* Avatar section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="avatarUrl">Profile Picture</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload an image or enter a URL from supported services (DiceBear, GitHub, Gravatar, Imgur, Unsplash, etc.)
                </p>
                
                {/* Avatar preview and controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Avatar preview */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="h-24 w-24 rounded-full border-2 border-border object-cover"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                        <Image className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Avatar controls */}
                  <div className="flex-1 space-y-3">
                    {/* File upload button (hidden input) */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {/* URL input */}
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl" className="text-sm">Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="avatarUrl"
                          value={avatarUrl}
                          onChange={(e) => handleAvatarUrlChange(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className="flex-1"
                        />
                        {avatarUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleClearAvatar}
                            title="Clear URL"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {avatarUrl && !isValidAvatarUrl(avatarUrl) && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Please enter a valid URL from a supported service
                        </p>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenFilePicker}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseDefaultAvatar}
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Use Default
                      </Button>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        Max file size: 5MB • Supported: JPG, PNG, GIF, WebP
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Avatar examples */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Example URLs:</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• DiceBear: https://api.dicebear.com/7.x/initials/svg?seed=username</li>
                  <li>• GitHub: https://avatars.githubusercontent.com/u/username</li>
                  <li>• Gravatar: https://www.gravatar.com/avatar/emailhash</li>
                  <li>• Imgur: https://i.imgur.com/abc123.jpg</li>
                </ul>
              </div>
            </div>
            
            {/* Change indicators */}
            {(username !== user.username || displayName !== user.displayName || avatarUrl !== (user.avatarUrl || '')) && (
              <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Changes to be saved:</h4>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                  {username !== user.username && (
                    <li>• Username: {user.username} → {username}</li>
                  )}
                  {displayName !== user.displayName && (
                    <li>• Display Name: {user.displayName} → {displayName}</li>
                  )}
                  {avatarUrl !== (user.avatarUrl || '') && (
                    <li>• Avatar: {user.avatarUrl ? 'Custom' : 'Default'} → {avatarUrl.trim() === '' ? 'Default' : 'Custom'}</li>
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
              disabled={isLoading || (username === user.username && displayName === user.displayName && avatarUrl === (user.avatarUrl || ''))}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (username === user.username && displayName === user.displayName && avatarUrl === (user.avatarUrl || ''))}
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
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Profile pictures are publicly visible. Please use appropriate images that follow community guidelines.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}