import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get today's date in YYYY-MM-DD format (EDT timezone)
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const [{ data: profile }, { data: stats }, { data: todayBattle }, { data: userStreak }] = await Promise.all([
    supabase.from('profiles').select('username, created_at').eq('id', user.id).single(),
    supabase.from('user_stats').select('elo, rank').eq('user_id', user.id).single(),
    supabase.from('daily_battle').select('*').eq('date', todayStr).single(),
    supabase.from('daily_streaks').select('current_streak, longest_streak, last_submission_date').eq('user_id', user.id).single()
  ])

  // Check if user submitted for today's battle
  let userSubmission = null
  if (todayBattle) {
    const { data } = await supabase
      .from('daily_submissions')
      .select('*')
      .eq('battle_id', todayBattle.id)
      .eq('user_id', user.id)
      .single()
    userSubmission = data
  }

  return (
    <DashboardClient
      initialProfile={profile}
      initialStats={stats}
      todayBattle={todayBattle || null}
      userSubmission={userSubmission || null}
      userStreak={userStreak || null}
    />
  )
}
