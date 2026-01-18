import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { userApi } from '@/lib/api'

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  isNew?: boolean
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRealUserData = async (tempUser: User): Promise<User | null> => {
    try {
      // Search for user by username (remove 'temp-' prefix)
      const username = tempUser.username
      const response = await userApi.getUsers({ search: username })
      const users = response.data.data || []
      
      // Find the user with matching username
      const realUser = users.find((u: any) => u.username === username)
      
      if (realUser) {
        return {
          id: realUser.id,
          username: realUser.username,
          displayName: realUser.displayName,
          avatarUrl: realUser.avatarUrl,
          isNew: false
        }
      }
      return null
    } catch (error) {
      console.error('Failed to fetch real user data:', error)
      return null
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          
          // Check if this is a temporary user (has temp- prefix in ID)
          if (parsedUser.id && parsedUser.id.startsWith('temp-')) {
            // Fetch real user data from API
            const realUser = await fetchRealUserData(parsedUser)
            if (realUser) {
              setUser(realUser)
              localStorage.setItem('user', JSON.stringify(realUser))
            } else {
              // Couldn't find real user, keep temp user but log warning
              console.warn('Could not find real user data for:', parsedUser.username)
              setUser(parsedUser)
            }
          } else {
            // Not a temp user, use as-is
            setUser(parsedUser)
          }
        } catch (error) {
          console.error('Failed to parse user data:', error)
          localStorage.removeItem('user')
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = async (userData: User) => {
    // Check if this is a temporary user
    if (userData.id && userData.id.startsWith('temp-')) {
      // Try to fetch real user data
      const realUser = await fetchRealUserData(userData)
      if (realUser) {
        setUser(realUser)
        localStorage.setItem('user', JSON.stringify(realUser))
        return
      }
    }
    // Not a temp user or couldn't fetch real data
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}