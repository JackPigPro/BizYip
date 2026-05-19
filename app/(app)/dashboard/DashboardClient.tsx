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

  // Inline bellringer state
  const [localSubmission, setLocalSubmission] = useState(userSubmission)
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [eloPopupGain, setEloPopupGain] = useState<number | null>(null)

  // Leaderboard toggle
  const [showMonthly, setShowMonthly] = useState(false)

  // Countdown timers (empty until client hydrates to avoid SSR mismatch)
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

  const card = {
    background: 'var(--card)',
    borderRadius: '16px',
    padding: '28px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
  } as const

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 700 as const,
    fontFamily: 'var(--font-display)',
    color: 'var(--text2)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  }

  const h2Style = {
    fontSize: '17px',
    fontWeight: 700 as const,
    fontFamily: 'var(--font-display)',
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.2px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="dashboard-grid">

          {/* ── ROW 1 ── */}

          {/* Welcome Card */}
          <div style={card}>
            <div style={labelStyle}>Dashboard</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-1px', marginBottom: '16px', lineHeight: 1.1 }}>
              {isLoading && !username ? (
                <span style={{ display: 'inline-block', width: '180px', height: '26px', background: 'var(--border)', borderRadius: '6px' }} />
              ) : `Welcome back, ${username}!`}
            </h1>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {userStreak?.current_streak || 0}🔥
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
                {userStreak?.current_streak && userStreak.current_streak > 0
                  ? `${userStreak.current_streak}-day streak — keep it up!`
                  : 'No streak yet — start today!'}
              </div>
            </div>
            <Link href="/compete/daily" style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: 'var(--green)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}>
              Today's Bellringer →
            </Link>
          </div>

          {/* Profile Nudge Card */}
          <div style={card}>
            {needsProfileNudge ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>👤</span>
                  <h2 style={h2Style}>Complete Your Profile</h2>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '14px', lineHeight: 1.5 }}>
                  A strong profile helps you get noticed by builders and co-founders.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                  {!initialProfile?.bio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span> Add a bio
                    </div>
                  )}
                  {!initialProfile?.skills?.length && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span> Add your skills
                    </div>
                  )}
                </div>
                <Link href={username ? `/profile/${username}` : '/dashboard'} style={{
                  display: 'inline-block',
                  padding: '10px 18px',
                  background: 'var(--blue)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                }}>
                  Edit Profile →
                </Link>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <h2 style={h2Style}>Your Profile</h2>
                </div>
                <div style={{ marginBottom: '6px', fontSize: '15px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  @{username}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: 'var(--surface)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: rankColor,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '20px',
                  border: '1px solid var(--border)',
                }}>
                  {userRank}
                </div>
                <div>
                  <Link href={username ? `/profile/${username}` : '/dashboard'} style={{
                    display: 'inline-block',
                    padding: '10px 18px',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    border: '1px solid var(--border)',
                  }}>
                    View Profile →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Announcements Card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '18px' }}>📢</span>
              <h2 style={h2Style}>What's New</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--green-tint)', borderRadius: '10px', borderLeft: '3px solid var(--green)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                  Daily Bellringer is live
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  Pitch your startup idea every day to build your streak and climb the leaderboard.
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--blue-tint)', borderRadius: '10px', borderLeft: '3px solid var(--blue)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                  Weekly Duels &amp; Live 1v1
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  Compete head-to-head and vote on the best pitches to earn ELO.
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--purple-tint)', borderRadius: '10px', borderLeft: '3px solid var(--purple)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                  Ideas Feed &amp; Co-founder Match
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  Share ideas, find feedback, and connect with potential co-founders.
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2 ── */}

          {/* Stats Card */}
          <div style={card}>
            <h2 style={{ ...h2Style, marginBottom: '20px' }}>Stats</h2>
            <div style={{ marginBottom: '20px' }}>
              <div style={labelStyle}>Total ELO</div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)', letterSpacing: '-2px', lineHeight: 1 }}>
                {userElo}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                {todayEloGain > 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    +{todayEloGain} today
                  </span>
                )}
                {monthEloGain > 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    +{monthEloGain} this month
                  </span>
                )}
              </div>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={labelStyle}>Rank</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: rankColor, fontFamily: 'var(--font-display)' }}>
                  {userRank}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Streak</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  {userStreak?.current_streak || 0}🔥
                </div>
              </div>
            </div>
            {allTimeRank !== null && (
              <div style={{ marginTop: '16px', padding: '10px', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  All-time rank: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>#{allTimeRank}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Today's Bellringer Card */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={h2Style}>Today's Bellringer</h2>
              {midnightCountdown && (
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text2)', background: 'var(--surface)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', whiteSpace: 'nowrap' as const }}>
                  ⏱ {midnightCountdown}
                </div>
              )}
            </div>

            {!todayBattle ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                No battle today
              </div>
            ) : localSubmission ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    Submitted!{eloPopupGain ? ` +${eloPopupGain} ELO` : ''}
                  </span>
                </div>
                <div style={labelStyle}>Your answer</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.5, padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', maxHeight: '100px', overflowY: 'auto' as const }}>
                  {localSubmission.content}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Link href="/compete/daily" style={{ fontSize: '13px', color: 'var(--green)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    See community responses →
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div style={labelStyle}>Today's prompt</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {todayBattle.prompt.length > 100 ? todayBattle.prompt.slice(0, 100) + '…' : todayBattle.prompt}
                </div>
                <textarea
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  placeholder="Pitch your answer in 300 characters…"
                  maxLength={320}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: charOver ? '#ef4444' : 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    {charCount}/300
                  </span>
                  <button
                    onClick={handleBellringerSubmit}
                    disabled={isSubmitting || !submissionText.trim() || charOver}
                    style={{
                      padding: '8px 16px',
                      background: isSubmitting || !submissionText.trim() || charOver ? 'var(--border)' : 'var(--green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      cursor: isSubmitting || !submissionText.trim() || charOver ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
                {submitError && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', fontFamily: 'var(--font-body)' }}>
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live 1v1 Card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <h2 style={h2Style}>Live 1v1</h2>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '10px', lineHeight: 1.4 }}>
                Pitch against another founder in real-time. Best pitch wins.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: queueCount > 0 ? 'var(--green-tint)' : 'var(--surface)', borderRadius: '20px', border: `1px solid ${queueCount > 0 ? 'var(--green)' : 'var(--border)'}` }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: queueCount > 0 ? 'var(--green)' : '#6b7280', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)', color: queueCount > 0 ? 'var(--green)' : 'var(--text2)' }}>
                  {queueCount > 0 ? `${queueCount} builder${queueCount !== 1 ? 's' : ''} waiting` : 'No one in queue'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/compete/live" style={{
                display: 'block',
                padding: '12px 16px',
                background: 'var(--purple)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
              }}>
                Find a Match
              </Link>
              <Link href="/compete/live" style={{
                display: 'block',
                padding: '12px 16px',
                background: 'var(--surface)',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
                Challenge a Friend
              </Link>
            </div>
          </div>

          {/* ── ROW 3 ── */}

          {/* Leaderboard Preview Card */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={h2Style}>Leaderboard</h2>
              <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setShowMonthly(false)}
                  style={{
                    padding: '4px 10px',
                    background: !showMonthly ? 'var(--card)' : 'transparent',
                    border: !showMonthly ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: !showMonthly ? 'var(--text)' : 'var(--text2)',
                    cursor: 'pointer',
                  }}
                >
                  All-Time
                </button>
                <button
                  onClick={() => setShowMonthly(true)}
                  style={{
                    padding: '4px 10px',
                    background: showMonthly ? 'var(--card)' : 'transparent',
                    border: showMonthly ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: showMonthly ? 'var(--text)' : 'var(--text2)',
                    cursor: 'pointer',
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>

            {!showMonthly ? (
              <div>
                {allTimeTop5.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text2)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>No data</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {allTimeTop5.map((entry, i) => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--surface)' }}>
                        <span style={{ width: '22px', fontSize: '14px', textAlign: 'center', flexShrink: 0 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-display)' }}>#{i + 1}</span>}
                        </span>
                        <Link href={`/profile/${entry.username}`} style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          @{entry.username}
                        </Link>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                          {entry.elo}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {allTimeRank !== null && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                    Your rank: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>#{allTimeRank}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {monthlyTop5.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text2)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>No activity this month</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {monthlyTop5.map((entry, i) => (
                      <div key={entry.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--surface)' }}>
                        <span style={{ width: '22px', fontSize: '14px', textAlign: 'center', flexShrink: 0 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-display)' }}>#{i + 1}</span>}
                        </span>
                        <Link href={`/profile/${entry.username}`} style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          @{entry.username}
                        </Link>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                          +{entry.gain}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {userMonthlyRank !== null && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                    Your rank: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>#{userMonthlyRank}</strong>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <Link href="/leaderboard" style={{ fontSize: '12px', color: 'var(--green)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Full Leaderboard →
              </Link>
            </div>
          </div>

          {/* Weekly Duel Card */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <h2 style={h2Style}>Weekly Duel</h2>
              {currentWeeklyDuel && (
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  color: currentWeeklyDuel.status === 'active' ? 'var(--green)' : 'var(--blue)',
                  background: currentWeeklyDuel.status === 'active' ? 'var(--green-tint)' : 'var(--blue-tint)',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                }}>
                  {currentWeeklyDuel.status === 'active' ? 'Open' : 'Voting'}
                </div>
              )}
            </div>

            {!currentWeeklyDuel ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                No active duel this week
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {currentWeeklyDuel.prompt.length > 120 ? currentWeeklyDuel.prompt.slice(0, 120) + '…' : currentWeeklyDuel.prompt}
                </div>
                {weeklyCountdown && weeklyCountdown !== 'Ended' && (
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '14px' }}>
                    {currentWeeklyDuel.status === 'active' ? '⏱ Closes in ' : '🗳 Voting ends in '}{weeklyCountdown}
                  </div>
                )}
                {hasSubmittedWeekly ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    <span>✅</span> Submitted
                  </div>
                ) : (
                  <Link href="/compete/weekly" style={{
                    display: 'inline-block',
                    padding: '10px 18px',
                    background: 'var(--blue)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {currentWeeklyDuel.status === 'active' ? 'Enter the Duel →' : 'Cast Your Vote →'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Idea Board Teaser Card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <h2 style={h2Style}>Ideas Feed</h2>
            </div>
            {recentIdeas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                No ideas yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {recentIdeas.map(idea => (
                  <div key={idea.id} style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {idea.title || idea.content.slice(0, 60) + (idea.content.length > 60 ? '…' : '')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                      @{idea.username}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/create/ideas" style={{
                flex: 1,
                display: 'block',
                padding: '10px 12px',
                background: 'var(--green)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
              }}>
                Share an Idea
              </Link>
              <Link href="/create/ideas" style={{
                flex: 1,
                display: 'block',
                padding: '10px 12px',
                background: 'var(--surface)',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
                border: '1px solid var(--border)',
              }}>
                Browse Feed
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
