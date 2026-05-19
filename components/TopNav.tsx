import TopNavClient from './TopNavClient'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/utils/auth'

export default function TopNav({
  initialUser,
  initialProfile,
  forceLoggedOut,
}: {
  initialUser?: User | null
  initialProfile?: UserProfile | null
  forceLoggedOut?: boolean
} = {}) {
  const showLoggedOutNav = forceLoggedOut || !initialUser || initialProfile?.onboarding_complete !== true

  return (
    <TopNavClient
      user={initialUser ? { email: initialUser.email, username: initialProfile?.username } : null}
      initialProfile={initialProfile}
      forceLoggedOut={showLoggedOutNav}
    />
  )
}
