export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

const getRankByElo = (elo?: number) => {
  if (!elo) return 'Builder'
  if (elo < 500) return 'Trainee'
  if (elo >= 500 && elo < 750) return 'Builder'
  if (elo >= 750 && elo < 1000) return 'Creator'
  if (elo >= 1000 && elo < 1250) return 'Founder'
  if (elo >= 1250 && elo < 1500) return 'Visionary'
  if (elo >= 1500 && elo < 1750) return 'Icon'
  if (elo >= 1750 && elo < 2000) return 'Titan'
  return 'Unicorn'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const easternNow = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }))

  // Midnight EST = UTC+5:00. Approximate — close enough for daily partitioning.
  const todayStartISO = `${todayStr}T05:00:00.000Z`
  const monthStartISO = `${easternNow.getFullYear()}-${String(easternNow.getMonth() + 1).padStart(2, '0')}-01T05:00:00.000Z`

  // Stage 1: all independent fetches in parallel
  const [
    profileResult,
    battleResult,
    streakResult,
    todayEloResult,
    monthEloResult,
    allTimeTop5Result,
    allMonthlyHistoryResult,
    weeklyDuelResult,
    recentIdeasResult,
    queueResult,
    onlineResult,
  ] = await Promise.all([
    supabase.from('profiles').select('username, created_at, bio, skills, elo, avatar_url').eq('id', user.id).single(),
    supabase.from('daily_battle').select('id, prompt, date').eq('date', todayStr).maybeSingle(),
    supabase.from('daily_streaks').select('current_streak, longest_streak, last_submission_date').eq('user_id', user.id).maybeSingle(),
    supabase.from('elo_history').select('elo_change').eq('user_id', user.id).gte('created_at', todayStartISO),
    supabase.from('elo_history').select('elo_change').eq('user_id', user.id).gte('created_at', monthStartISO),
    supabase.from('profiles').select('id, username, elo').order('elo', { ascending: false }).order('id', { ascending: true }).limit(5),
    supabase.from('elo_history').select('user_id, elo_change').gte('created_at', monthStartISO),
    supabase.from('weekly_duel').select('id, prompt, status, end_date').in('status', ['active', 'voting']).order('start_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ideas').select('id, title, content, user_id').eq('is_public', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const profile = profileResult.data
  const todayBattle = battleResult.data
  const userStreak = streakResult.data
  const userElo = profile?.elo ?? 500
  const weeklyDuel = weeklyDuelResult.data

  const todayEloGain = (todayEloResult.data || []).reduce((sum: number, r: { elo_change: number }) => sum + (r.elo_change || 0), 0)
  const monthEloGain = (monthEloResult.data || []).reduce((sum: number, r: { elo_change: number }) => sum + (r.elo_change || 0), 0)

  // Compute monthly leaderboard rankings from elo_history
  const gainsByUser: Record<string, number> = {}
  for (const entry of allMonthlyHistoryResult.data || []) {
    gainsByUser[entry.user_id] = (gainsByUser[entry.user_id] || 0) + (entry.elo_change || 0)
  }
  const sortedByMonthlyGain = Object.entries(gainsByUser)
    .filter(([, g]) => g > 0)
    .sort(([aId, a], [bId, b]) => b - a || aId.localeCompare(bId))

  const userMonthlyRankIdx = sortedByMonthlyGain.findIndex(([uid]) => uid === user.id)
  const userMonthlyRank = userMonthlyRankIdx >= 0 ? userMonthlyRankIdx + 1 : null
  const top5MonthlyUserIds = sortedByMonthlyGain.slice(0, 5).map(([uid]) => uid)

  // Stage 2: fetches that depend on stage 1 results
  const [rankResult, submissionResult, weeklySubResult, top5MonthlyProfilesResult, ideaProfilesResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('elo', userElo),
    todayBattle
      ? supabase.from('daily_submissions').select('id, content, created_at').eq('battle_id', todayBattle.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    weeklyDuel
      ? supabase.from('duel_submissions').select('id').eq('duel_id', weeklyDuel.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    top5MonthlyUserIds.length > 0
      ? supabase.from('profiles').select('id, username').in('id', top5MonthlyUserIds)
      : Promise.resolve({ data: [] as { id: string; username: string }[], error: null }),
    (recentIdeasResult.data || []).length > 0
      ? supabase.from('profiles').select('id, username').in('id', (recentIdeasResult.data || []).map((i: { user_id: string }) => i.user_id))
      : Promise.resolve({ data: [] as { id: string; username: string }[], error: null }),
  ])

  const allTimeRank = rankResult.count !== null ? rankResult.count + 1 : null

  const top5MonthlyProfiles = (top5MonthlyProfilesResult.data || []) as { id: string; username: string }[]
  const monthlyTop5 = top5MonthlyUserIds.map(uid => {
    const p = top5MonthlyProfiles.find(x => x.id === uid)
    return { user_id: uid, username: p?.username || 'Unknown', gain: gainsByUser[uid] || 0 }
  })

  const ideaProfiles = (ideaProfilesResult.data || []) as { id: string; username: string }[]
  const recentIdeas = (recentIdeasResult.data || []).map((idea: { id: string; title?: string; content?: string; user_id: string }) => ({
    id: idea.id,
    title: idea.title || '',
    content: idea.content || '',
    username: ideaProfiles.find(p => p.id === idea.user_id)?.username || 'Unknown',
  }))

  return (
    <DashboardClient
      initialProfile={profile ? {
        username: profile.username || '',
        created_at: profile.created_at || '',
        bio: profile.bio || null,
        skills: profile.skills || null,
        avatar_url: (profile as { avatar_url?: string | null }).avatar_url || null,
      } : null}
      initialStats={{ elo: userElo, rank: getRankByElo(userElo) }}
      todayBattle={todayBattle || null}
      userSubmission={(submissionResult.data as { id: string; content: string; created_at: string } | null) || null}
      userStreak={userStreak || null}
      todayEloGain={todayEloGain}
      monthEloGain={monthEloGain}
      allTimeRank={allTimeRank}
      allTimeTop5={(allTimeTop5Result.data || []) as { id: string; username: string; elo: number }[]}
      monthlyTop5={monthlyTop5}
      userMonthlyRank={userMonthlyRank}
      currentWeeklyDuel={weeklyDuel ? {
        id: weeklyDuel.id,
        prompt: weeklyDuel.prompt,
        status: weeklyDuel.status,
        end_date: weeklyDuel.end_date || null,
      } : null}
      hasSubmittedWeekly={!!weeklySubResult.data}
      recentIdeas={recentIdeas}
      queueCount={queueResult.count || 0}
      onlineCount={onlineResult.count || 0}
      needsProfileNudge={!profile?.bio || !(profile?.skills?.length) || !(profile as { avatar_url?: string | null })?.avatar_url}
      userId={user.id}
    />
  )
}
