import { createClient } from '@/utils/supabase/server'
import TopNavClient from './TopNavClient'
import { getAuthState } from '@/utils/auth'

export default async function TopNav({ forceLoggedOut }: { forceLoggedOut?: boolean } = {}) {
  const { user, profile, isFullyAuthenticated, needsOnboarding } = await getAuthState()
  
  // Show logged out navbar if:
  // 1. forceLoggedOut is explicitly set
  // 2. No user is authenticated
  // 3. User exists but needs onboarding (hasn't completed it)
  const showLoggedOutNav = forceLoggedOut || !user || needsOnboarding

  return <TopNavClient user={user ? { email: user.email, name: profile?.username, username: profile?.username } : null} forceLoggedOut={showLoggedOutNav} />
}

