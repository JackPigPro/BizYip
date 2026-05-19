'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'

interface AllTimeEntry {
  id: string
  username: string
  elo: number
}

interface MonthlyEntry {
  user_id: string
  username: string
  gain: number
}

interface RecentIdea {
  id: string
  title: string
  content: string
  username: string
}

interface WeeklyDuel {
  id: string
  prompt: string
  status: string
  end_date: string | null
}

interface DashboardClientProps {
  initialProfile: { username: string; created_at: string; bio: string | null; skills: string[] | null } | null
  initialStats: { elo: number; rank: string } | null
  todayBattle: { id: string; prompt: string; date: string } | null
  userSubmission: { id: string; content: string; created_at: string } | null
  userStreak: { current_streak: number; longest_streak: number; last_submission_date: string | null } | null
  todayEloGain: number
  monthEloGain: number
  allTimeRank: number | null
  allTimeTop5: AllTimeEntry[]
  monthlyTop5: MonthlyEntry[]
  userMonthlyRank: number | null
  currentWeeklyDuel: WeeklyDuel | null
  hasSubmittedWeekly: boolean
  recentIdeas: RecentIdea[]
  queueCount: number
  needsProfileNudge: boolean
  userId: string
}

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

const getRankColor = (rank: string) => {
  switch (rank) {
    case 'Trainee': return '#9ca3af'
    case 'Builder': return '#2563eb'
    case 'Creator': return '#16a34a'
    case 'Founder': return '#ca8a04'
    case 'Visionary': return '#7c3aed'
    case 'Icon': return '#ea580c'
    case 'Titan': return '#dc2626'
    case 'Unicorn': return '#8b5cf6'
    default: return '#9ca3af'
  }
}

const getMidnightCountdown = () => {
  const now = new Date()
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const midnight = new Date(eastern.getFullYear(), eastern.getMonth(), eastern.getDate() + 1, 0, 0, 0)
  const diff = midnight.getTime() - eastern.getTime()
  if (diff <= 0) return '00:00:00'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const getDeadlineCountdown = (deadline: string) => {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (d > 0) return `${d}d ${h}h`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DashboardClient({
  initialProfile,
  initialStats,
  todayBattle,
  userSubmission,
  userStreak,
  todayEloGain,
  monthEloGain,
  allTimeRank,
  allTimeTop5,
  monthlyTop5,
  userMonthlyRank,
  currentWeeklyDuel,
  hasSubmittedWeekly,
  recentIdeas,
  queueCount,
  needsProfileNudge,
  userId,
}: DashboardClientProps) {
  const { username: contextUsername, isLoading } = useUser()
  const username = isLoading ? (initialProfile?.username ?? '') : (contextUsername ?? '')
  const userElo = initialStats?.elo ?? 500
  const userRank = getRankByElo(userElo)
  const rankColor = getRankColor(userRank)

  const [localSubmission, setLocalSubmission] = useState(userSubmission)
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [eloPopupGain, setEloPopupGain] = useState<number | null>(null)
  const [showMonthly, setShowMonthly] = useState(false)
  const [midnightCountdown, setMidnightCountdown] = useState('')
  const [weeklyCountdown, setWeeklyCountdown] = useState('')

  useEffect(() => {
    const tick = () => {
      setMidnightCountdown(getMidnightCountdown())
      if (currentWeeklyDuel?.end_date) {
        const endNorm = currentWeeklyDuel.end_date.endsWith('Z')
          ? currentWeeklyDuel.end_date
          : currentWeeklyDuel.end_date + 'Z'
        if (currentWeeklyDuel.status === 'active') {
          setWeeklyCountdown(getDeadlineCountdown(endNorm))
        } else if (currentWeeklyDuel.status === 'voting') {
          const voteEnd = new Date(new Date(endNorm).getTime() + 24 * 60 * 60 * 1000)
          setWeeklyCountdown(getDeadlineCountdown(voteEnd.toISOString()))
        }
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentWeeklyDuel])

  const charCount = submissionText.length
  const charOver = charCount > 300

  const handleBellringerSubmit = async () => {
    if (!todayBattle || !submissionText.trim() || charOver) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/compete/daily/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId: todayBattle.id, content: submissionText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit')
      } else {
        setLocalSubmission(data.submission)
        setEloPopupGain(data.eloGained)
      }
    } catch {
      setSubmitError('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Card base style — used for all cards
  const C: React.CSSProperties = {
    background: 'var(--card)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
  }
  // Compact card for the top-right section
  const SC: React.CSSProperties = { ...C, padding: '12px 14px' }

  // Shared label style
  const lbl: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--text2)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '3px',
  }

  // Row grid — same proportions for middle and bottom rows
  const rowGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1.8fr 1.2fr',
    gap: '14px',
    alignItems: 'start',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '20px 24px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ══════════════════════════════════════════════
            TOP SECTION — bare text left, small cards right
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>

          {/* Left: page title + greeting + streak — NO surrounding card */}
          <div>
            <div style={lbl}>Dashboard</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.8px', margin: '0 0 5px 0', lineHeight: 1.1 }}>
              {isLoading && !username
                ? <span style={{ display: 'inline-block', width: '200px', height: '24px', background: 'var(--border)', borderRadius: '4px' }} />
                : `Welcome back, ${username}!`}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {userStreak?.current_streak || 0}🔥
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                {(userStreak?.current_streak ?? 0) > 0 ? 'day streak' : 'start your streak today'}
              </span>
            </div>
          </div>

          {/* Right: two compact cards */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>

            {/* Profile checklist */}
            <div style={SC}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '7px' }}>
                Profile
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-body)', color: initialProfile?.bio ? 'var(--green)' : 'var(--text2)' }}>
                  <span style={{ fontWeight: 700, width: '10px' }}>{initialProfile?.bio ? '✓' : '○'}</span>Bio
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-body)', color: initialProfile?.skills?.length ? 'var(--green)' : 'var(--text2)' }}>
                  <span style={{ fontWeight: 700, width: '10px' }}>{initialProfile?.skills?.length ? '✓' : '○'}</span>Skills
                </div>
              </div>
              {needsProfileNudge && username && (
                <Link href={`/profile/${username}`} style={{ display: 'block', marginTop: '8px', fontSize: '11px', color: 'var(--blue)', fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'none' }}>
                  Complete →
                </Link>
              )}
            </div>

            {/* Announcements */}
            <div style={{ ...SC, maxWidth: '210px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '7px' }}>
                What's New
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.45 }}>
                Daily Bellringer is live — pitch every day to build your streak.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.45, marginTop: '5px' }}>
                Weekly Duels every Monday — compete for top ELO.
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MIDDLE ROW — Stats | Bellringer | Live 1v1
            ══════════════════════════════════════════════ */}
        <div style={rowGrid}>

          {/* ── Col 1: Stats ── */}
          <div style={C}>
            {/* All-time rank — top right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              {allTimeRank !== null
                ? <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>All-time <strong style={{ color: 'var(--text)' }}>#{allTimeRank}</strong></span>
                : <span />}
            </div>
            {/* Streak */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {userStreak?.current_streak || 0}🔥
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginLeft: '6px' }}>
                {(userStreak?.current_streak ?? 0) > 0 ? 'days' : 'no streak'}
              </span>
            </div>
            {/* Rank badge */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', background: 'var(--surface)', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: rankColor, fontFamily: 'var(--font-display)', border: '1px solid var(--border)' }}>
                {userRank}
              </span>
            </div>
            {/* ELO stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--surface)', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Today</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: todayEloGain > 0 ? 'var(--green)' : 'var(--text2)', fontFamily: 'var(--font-display)' }}>
                  {todayEloGain > 0 ? `+${todayEloGain}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--surface)', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>This month</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: monthEloGain > 0 ? 'var(--text)' : 'var(--text2)', fontFamily: 'var(--font-display)' }}>
                  {monthEloGain > 0 ? `+${monthEloGain}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'var(--green-tint)', borderRadius: '6px', border: '1px solid var(--green)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Total ELO</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                  {userElo}
                </span>
              </div>
            </div>
          </div>

          {/* ── Col 2: Bellringer ── */}
          <div style={C}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Today's Bellringer</span>
              {midnightCountdown && (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text2)', background: 'var(--surface)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  ⏱ {midnightCountdown}
                </span>
              )}
            </div>

            {!todayBattle ? (
              <div style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>No battle today.</div>
            ) : localSubmission ? (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {todayBattle.prompt}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    ✅ Submitted{eloPopupGain ? ` +${eloPopupGain} ELO` : ''}
                  </span>
                  <Link href="/compete/daily" style={{ fontSize: '12px', color: 'var(--text2)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    View answers →
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: '10px' }}>
                  {todayBattle.prompt}
                </div>
                <textarea
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  placeholder="Your pitch in 300 chars…"
                  maxLength={320}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--surface)',
                    border: `1px solid ${charOver ? '#ef4444' : 'var(--border)'}`,
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={handleBellringerSubmit}
                      disabled={isSubmitting || !submissionText.trim() || charOver}
                      style={{
                        padding: '7px 14px',
                        background: isSubmitting || !submissionText.trim() || charOver ? 'var(--border)' : 'var(--green)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        cursor: isSubmitting || !submissionText.trim() || charOver ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit'}
                    </button>
                    <Link href="/compete/daily" style={{ fontSize: '12px', color: 'var(--text2)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      View answers →
                    </Link>
                  </div>
                  <span style={{ fontSize: '11px', color: charOver ? '#ef4444' : 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    {charCount}/300
                  </span>
                </div>
                {submitError && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#ef4444', fontFamily: 'var(--font-body)' }}>{submitError}</div>
                )}
              </div>
            )}
          </div>

          {/* ── Col 3: Live 1v1 ── */}
          <div style={C}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Live 1v1</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <Link href="/compete/live" style={{
                display: 'block', padding: '10px 16px', background: 'var(--purple)', color: 'white',
                textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                fontFamily: 'var(--font-display)', textAlign: 'center',
              }}>
                Jump into live duel
              </Link>
              <Link href="/compete/weekly" style={{
                display: 'block', padding: '10px 16px', background: 'var(--surface)', color: 'var(--text)',
                textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                fontFamily: 'var(--font-display)', textAlign: 'center', border: '1px solid var(--border)',
              }}>
                Judge duels
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: queueCount > 0 ? 'var(--green)' : '#6b7280', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: queueCount > 0 ? 'var(--green)' : 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {queueCount > 0 ? `${queueCount} in queue` : 'Queue empty'}
              </span>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════
            BOTTOM ROW — Leaderboard | Weekly Duel | Ideas
            ══════════════════════════════════════════════ */}
        <div style={rowGrid}>

          {/* ── Col 1: Leaderboard Preview ── */}
          <div style={C}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Leaderboard</span>
              <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <button onClick={() => setShowMonthly(false)} style={{ padding: '3px 8px', background: !showMonthly ? 'var(--card)' : 'transparent', border: 'none', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-display)', color: !showMonthly ? 'var(--text)' : 'var(--text2)', cursor: 'pointer' }}>
                  All-time
                </button>
                <button onClick={() => setShowMonthly(true)} style={{ padding: '3px 8px', background: showMonthly ? 'var(--card)' : 'transparent', border: 'none', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-display)', color: showMonthly ? 'var(--text)' : 'var(--text2)', cursor: 'pointer' }}>
                  Monthly
                </button>
              </div>
            </div>

            {!showMonthly ? (
              <>
                {allTimeTop5.length === 0
                  ? <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>No data</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {allTimeTop5.map((entry, i) => (
                        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: 'var(--surface)' }}>
                          <span style={{ width: '18px', textAlign: 'center', fontSize: '13px', flexShrink: 0 }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-display)' }}>#{i + 1}</span>}
                          </span>
                          <Link href={`/profile/${entry.username}`} style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            @{entry.username}
                          </Link>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                            {entry.elo}
                          </span>
                        </div>
                      ))}
                    </div>
                }
                {allTimeRank !== null && allTimeRank > 5 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: 'var(--surface)', borderRadius: '20px', fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700, border: '1px solid var(--border)' }}>
                      You: #{allTimeRank}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {monthlyTop5.length === 0
                  ? <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>No activity this month</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {monthlyTop5.map((entry, i) => (
                        <div key={entry.user_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: 'var(--surface)' }}>
                          <span style={{ width: '18px', textAlign: 'center', fontSize: '13px', flexShrink: 0 }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-display)' }}>#{i + 1}</span>}
                          </span>
                          <Link href={`/profile/${entry.username}`} style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            @{entry.username}
                          </Link>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                            +{entry.gain}
                          </span>
                        </div>
                      ))}
                    </div>
                }
                {userMonthlyRank !== null && userMonthlyRank > 5 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: 'var(--surface)', borderRadius: '20px', fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700, border: '1px solid var(--border)' }}>
                      You: #{userMonthlyRank}
                    </span>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: '10px', textAlign: 'right' }}>
              <Link href="/leaderboard" style={{ fontSize: '11px', color: 'var(--green)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Full leaderboard →
              </Link>
            </div>
          </div>

          {/* ── Col 2: Weekly Duel ── */}
          <div style={C}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Weekly Duel</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentWeeklyDuel && (
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, color: currentWeeklyDuel.status === 'active' ? 'var(--green)' : 'var(--blue)', background: currentWeeklyDuel.status === 'active' ? 'var(--green-tint)' : 'var(--blue-tint)', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {currentWeeklyDuel.status === 'active' ? 'Open' : 'Voting'}
                  </span>
                )}
                {weeklyCountdown && weeklyCountdown !== 'Ended' && (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text2)', background: 'var(--surface)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    ⏱ {weeklyCountdown}
                  </span>
                )}
              </div>
            </div>

            {!currentWeeklyDuel ? (
              <div style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>No active duel this week.</div>
            ) : (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {currentWeeklyDuel.prompt.length > 200 ? currentWeeklyDuel.prompt.slice(0, 200) + '…' : currentWeeklyDuel.prompt}
                </div>
                {hasSubmittedWeekly ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>✅ Submitted</span>
                    <Link href="/compete/weekly" style={{ fontSize: '12px', color: 'var(--text2)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      View submissions →
                    </Link>
                  </div>
                ) : (
                  <Link href="/compete/weekly" style={{
                    display: 'inline-block', padding: '8px 16px', background: 'var(--blue)', color: 'white',
                    textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {currentWeeklyDuel.status === 'active' ? 'Enter the Duel →' : 'Cast Your Vote →'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Col 3: Idea Board Teaser ── */}
          <div style={C}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>💡</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Ideas Feed</span>
              </div>
              <Link href="/create/ideas" style={{ fontSize: '11px', color: 'var(--text2)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {recentIdeas.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>No ideas yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {recentIdeas.map(idea => (
                  <div key={idea.id} style={{ padding: '7px 10px', background: 'var(--surface)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {idea.title || idea.content.slice(0, 55) + (idea.content.length > 55 ? '…' : '')}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>@{idea.username}</div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/create/ideas" style={{
              display: 'block', padding: '8px 12px', background: 'var(--green)', color: 'white',
              textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              fontFamily: 'var(--font-display)', textAlign: 'center',
            }}>
              Share an Idea
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
