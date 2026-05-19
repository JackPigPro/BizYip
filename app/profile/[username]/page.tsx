export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfilePage from '@/components/ProfilePage'
import ProfileLoading from '@/components/ProfileLoading'
import ProfileNotFound from '@/components/ProfileNotFound'
import { Suspense } from 'react'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

async function ProfileContent({ username }: { username: string }) {
  const supabase = await createClient()

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    return <ProfileNotFound username={username} />
  }

  // Fetch all-time rank (count users with higher ELO)
  const { count: allTimeRankCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('elo', profile?.elo || 0)
  const allTimeRank = allTimeRankCount !== null ? allTimeRankCount + 1 : null

  // Fetch daily rank using same approach as leaderboard
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  // Get all user stats for daily ranking
  const { data: allUserStats, error: allStatsError } = await supabase
    .from('profiles')
    .select('id, elo')
    .order('elo', { ascending: false })

  // Get all daily history
  const { data: dailyHistory, error: dailyError } = await supabase
    .from('elo_history')
    .select('elo_change, user_id')
    .gte('created_at', oneDayAgo)

  // Calculate daily rank like leaderboard does
  let dailyRank = null
  if (allUserStats && dailyHistory) {
    // Create complete daily list with all users and their gains
    const completeDailyList = allUserStats.map(user => {
      const userDailyEntries = dailyHistory.filter(entry => entry.user_id === user.id)
      const totalDailyGain = userDailyEntries.reduce((sum, entry) => sum + (entry.elo_change || 0), 0)
      
      return {
        user_id: user.id,
        dailyGain: totalDailyGain
      }
    }).sort((a, b) => {
      // Sort by daily gain descending, then by user_id ascending to prevent ties
      if (b.dailyGain !== a.dailyGain) {
        return b.dailyGain - a.dailyGain
      }
      return a.user_id.localeCompare(b.user_id)
    })

    // Find current user's rank
    const userIndex = completeDailyList.findIndex(user => user.user_id === profile.id)
    if (userIndex !== -1) {
      dailyRank = userIndex + 1
    }
  }

  // Fetch user's ideas
  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
  const { count: weeklyDuelsCount } = await supabase
    .from('duel_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  // Check if user has entered the current weekly duel
  let hasEnteredCurrentDuel = false
  const { data: currentActiveDuel } = await supabase
    .from('weekly_duel')
    .select('id')
    .in('status', ['active', 'voting'])
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (currentActiveDuel) {
    const { data: currentDuelSubmission } = await supabase
      .from('duel_submissions')
      .select('id')
      .eq('user_id', profile.id)
      .eq('duel_id', currentActiveDuel.id)
      .maybeSingle()
    
    hasEnteredCurrentDuel = !!currentDuelSubmission
  }

  // Fetch daily streak data
  const { data: dailyStreak, error: streakError } = await supabase
    .from('daily_streaks')
    .select('current_streak, longest_streak, last_submission_date')
    .eq('user_id', profile.id)
    .single()

  // Get current user to check if this is their own profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  return (
    <ProfilePage
      profile={profile}
      userStats={{ elo: profile?.elo || 0, rank: allTimeRank?.toString(), weekly_duel_entered: weeklyDuelsCount || 0 }}
      ideas={ideas || []}
      isOwnProfile={isOwnProfile}
      allTimeRank={allTimeRank}
      dailyRank={dailyRank}
      weeklyDuelsCount={weeklyDuelsCount || 0}
      hasEnteredCurrentDuel={hasEnteredCurrentDuel}
      dailyStreak={dailyStreak || null}
    />
  )
}

export default async function ProfilePageRoute({ params }: ProfilePageProps) {
  const { username } = await params

  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent username={username} />
    </Suspense>
  )
}