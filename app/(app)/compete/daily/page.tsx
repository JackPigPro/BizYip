export const dynamic = 'force-dynamic'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DailyBattleClient from './DailyBattleClient'

interface DailyBattle {
  id: string
  prompt: string
  date: string
  created_at: string
}

interface UserSubmission {
  id: string
  content: string
  created_at: string
}

interface DailyStreak {
  current_streak: number
  longest_streak: number
  last_submission_date: string | null
}

async function getTodayBattle(): Promise<DailyBattle | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
  
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  
  const { data, error } = await supabase
    .from('daily_battle')
    .select('*')
    .eq('date', today)
    .single()
    
  if (error || !data) return null
  return data
}

async function getUserSubmission(battleId: string, userId: string): Promise<UserSubmission | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
  
  const { data, error } = await supabase
    .from('daily_submissions')
    .select('*')
    .eq('battle_id', battleId)
    .eq('user_id', userId)
    .single()
    
  if (error || !data) return null
  return data
}

async function getUserStreak(userId: string): Promise<DailyStreak | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
  
  const { data, error } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  if (error || !data) return null
  return data
}

export default async function DailyBattlePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
  
  // Get authenticated user (optional)
  const { data: { user } } = await supabase.auth.getUser()
  
  let userSubmission = null
  let userStreak = null
  
  // Only fetch user-specific data if authenticated and onboarded
  if (user) {
    // Get user profile to check onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_complete) {
      // Fetch today's battle
      const battle = await getTodayBattle()
      
      // Fetch user's submission and streak
      const [submission, streak] = await Promise.all([
        getUserSubmission(battle?.id || '', user.id),
        getUserStreak(user.id)
      ])
      
      userSubmission = submission
      userStreak = streak
      
      return (
        <DailyBattleClient 
          battle={battle}
          userSubmission={userSubmission}
          userStreak={userStreak}
          userId={user.id}
        />
      )
    }
  }
  
  // For non-authenticated users or non-onboarded users, fetch only public data
  const battle = await getTodayBattle()
  
  return (
    <DailyBattleClient 
      battle={battle}
      userSubmission={null}
      userStreak={null}
      userId=""
    />
  )
}
