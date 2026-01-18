import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type DarkModeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}

interface DarkModeProviderProps {
  children: ReactNode
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Update localStorage when dark mode changes
    localStorage.setItem('darkMode', String(isDarkMode))
    
    // Update the HTML class
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}