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

/**
 * Client-side authentication logic that matches server-side behavior
 * Returns user data and authentication state based on onboarding completion
 */
export async function getAuthStateClient(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
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
  } catch (error) {
    console.error('Auth error:', error)
    return {
      user: null,
      profile: null,
      isFullyAuthenticated: false,
      needsOnboarding: false
    }
  }
}
