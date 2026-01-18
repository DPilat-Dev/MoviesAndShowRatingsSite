import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="relative"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  )
}