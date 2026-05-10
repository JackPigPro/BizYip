import { createClient } from '@/utils/supabase/server'
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

/**
 * Shared authentication logic that works consistently across server and client
 * Returns user data and authentication state based on onboarding completion
 */
export async function getAuthState(): Promise<AuthResult> {
  const supabase = await createClient()
  
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
      break
    }
  }
  
  // If we still have errors after retries or no user, treat as logged out
  if (userError || !user) {
    return {
      user: null,
      profile: null,
      isFullyAuthenticated: false,
      needsOnboarding: false
    }
  }

  // Get user profile with error handling
  let profile = null
  try {
    const result = await supabase
      .from('profiles')
      .select('id, username, status_tags, onboarding_complete, created_at')
      .eq('id', user.id)
      .single()
    
    profile = result.data
  } catch (err) {
    // Profile fetch failed, continue with null profile
  }

  const isFullyAuthenticated = !!(profile?.onboarding_complete === true)
  const needsOnboarding = user && (!profile || profile.onboarding_complete !== true)

  return {
    user,
    profile: profile || null,
    isFullyAuthenticated,
    needsOnboarding
  }
}

/**
 * Server-side function to check if user should be redirected to onboarding
 */
export async function shouldRedirectToOnboarding(): Promise<boolean> {
  const { needsOnboarding } = await getAuthState()
  return needsOnboarding
}

/**
 * Server-side function to check if user is fully authenticated (completed onboarding)
 */
export async function isUserFullyAuthenticated(): Promise<boolean> {
  const { isFullyAuthenticated } = await getAuthState()
  return isFullyAuthenticated
}
