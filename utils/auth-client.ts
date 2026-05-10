import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  username: string
  status_tags?: string[]
  onboarding_complete?: boolean
  created_at: string
  elo?: number
}

export interface AuthResult {
  user: User | null
  profile: UserProfile | null
  isFullyAuthenticated: boolean
  needsOnboarding: boolean
}

// Track ongoing auth requests to prevent duplicates
let ongoingAuthRequest: Promise<AuthResult> | null = null

/**
 * Client-side authentication logic that matches server-side behavior
 * Returns user data and authentication state based on onboarding completion
 */
export async function getAuthStateClient(): Promise<AuthResult> {
  // If there's already an ongoing request, return it
  if (ongoingAuthRequest) {
    return ongoingAuthRequest
  }

  // Create new request and store it
  ongoingAuthRequest = (async () => {
    try {
      const supabase = createClient()
      
      // Get current user with retry logic for lock conflicts
      let user: User | null = null
      let userError: any = null
      let retries = 0
      const maxRetries = 2 // Reduce retries to be more conservative

      while (retries < maxRetries) {
        try {
          const result = await supabase.auth.getUser()
          user = result.data.user
          userError = result.error
          
          // If we get a lock error, retry
          if (userError?.message?.includes('lock') || 
              (userError && userError.message?.includes('stole it'))) {
            retries++
            await new Promise(resolve => setTimeout(resolve, 200 * retries))
            continue
          }
          
          // For any other error, don't retry
          break
        } catch (err: any) {
          retries++
          if (err.message?.includes('lock') || err.message?.includes('stole it')) {
            // Lock conflict, wait and retry
            await new Promise(resolve => setTimeout(resolve, 200 * retries))
            continue
          }
          // For other errors, treat as no user
          console.log('Auth error, treating as logged out:', err.message)
          break
        }
      }
      
      if (userError || !user) {
        return {
          user: null,
          profile: null,
          isFullyAuthenticated: false,
          needsOnboarding: false
        }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, status_tags, onboarding_complete, created_at, elo')
        .eq('id', user.id)
        .single()

      const isFullyAuthenticated = !!(profile && profile.onboarding_complete === true)
      const needsOnboarding = !!(user && (!profile || profile.onboarding_complete === false))

      return {
        user,
        profile: profile || null,
        isFullyAuthenticated,
        needsOnboarding
      }
    } finally {
      // Clear the ongoing request when done
      ongoingAuthRequest = null
    }
  })()

  return ongoingAuthRequest
}
