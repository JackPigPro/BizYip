'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSupabase } from '@/components/SupabaseProvider'
import { Database } from '@/types/database'

type Theme = 'light' | 'dark'
type Profile = Database['public']['Tables']['profiles']['Row']

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabase()
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    initializeTheme()
  }, [user])

  const initializeTheme = async () => {
    try {
      let savedTheme: Theme | null = null

      // First try to get theme from Supabase if user is logged in
      if (user) {
        const { data: profile } = await fetch('/api/profile')
          .then(res => res.json())
          .catch(() => ({ profile: null }))
        
        if (profile?.theme_preference) {
          savedTheme = profile.theme_preference
        }
      }

      // Fallback to localStorage if no Supabase theme
      if (!savedTheme) {
        savedTheme = localStorage.getItem('bizyip-theme') as Theme | null
      }

      // If no saved theme, detect system preference
      let finalTheme: Theme
      if (savedTheme) {
        finalTheme = savedTheme
      } else {
        // Check system preference
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        finalTheme = systemPrefersDark ? 'dark' : 'light'
      }

      // Special case: if saved theme is light but system prefers dark, and user hasn't explicitly set it, use system preference
      if (savedTheme === 'light' && !localStorage.getItem('bizyip-theme-explicit')) {
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemPrefersDark) {
          finalTheme = 'dark'
        }
      }
      
      setThemeState(finalTheme)
      localStorage.setItem('bizyip-theme', finalTheme)
      document.body.setAttribute('data-theme', finalTheme)
    } catch (error) {
      console.error('Error initializing theme:', error)
      // Fallback to dark theme as default
      setThemeState('dark')
      localStorage.setItem('bizyip-theme', 'dark')
      document.body.setAttribute('data-theme', 'dark')
    } finally {
      setIsLoading(false)
    }
  }

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('bizyip-theme', newTheme)
    localStorage.setItem('bizyip-theme-explicit', 'true')
    document.body.setAttribute('data-theme', newTheme)

    // Save to Supabase if user is logged in
    if (user) {
      try {
        await fetch('/api/profile/theme', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme_preference: newTheme }),
        })
      } catch (error) {
        console.error('Error saving saving theme to Supabase:', error)
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
