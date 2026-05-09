'use client'

import { useState } from 'react'

interface User {
  elo: number
  user_id: string
  rank_label: string
  profiles: {
    username: string
    avatar: string
  }
  current_streak: number
}

interface EloHistory {
  elo_change: number
  new_elo: number
  user_id: string
  rank_label: string
  created_at: string
  profiles: {
    username: string
    avatar: string
  }
}

interface LeaderboardClientProps {
  allUsers: User[]
  dailyHistory: EloHistory[]
  weeklyHistory: EloHistory[]
  monthlyHistory: EloHistory[]
  currentUserId?: string | null
  currentUserStats?: {
    elo: number
    rank: string
  } | null
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
    case 'Trainee': return '#6b7280' // darker grey, more vibrant
    case 'Builder': return '#2563eb' // brighter blue
    case 'Creator': return '#16a34a' // brighter green
    case 'Founder': return '#f59e0b' // brighter gold
    case 'Visionary': return '#9333ea' // brighter purple
    case 'Icon': return '#ea580c' // brighter orange
    case 'Titan': return '#dc2626' // brighter red
    case 'Unicorn': return 'linear-gradient(135deg, #7c3aed, #ec4899, #10b981)' // rainbow gradient
    default: return '#6b7280'
  }
}

const getRankFaintColor = (rank: string) => {
  switch (rank) {
    case 'Trainee': return 'rgba(107, 114, 128, 0.25)' // faint grey
    case 'Builder': return 'rgba(37, 99, 235, 0.25)' // faint blue
    case 'Creator': return 'rgba(22, 163, 74, 0.25)' // faint green
    case 'Founder': return 'rgba(245, 158, 11, 0.25)' // faint gold
    case 'Visionary': return 'rgba(147, 51, 234, 0.25)' // faint purple
    case 'Icon': return 'rgba(234, 88, 12, 0.25)' // faint orange
    case 'Titan': return 'rgba(220, 38, 38, 0.25)' // faint red
    case 'Unicorn': return 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(236, 72, 153, 0.25), rgba(16, 185, 129, 0.25))' // faint rainbow gradient
    default: return 'rgba(107, 114, 128, 0.25)'
  }
}

const getRankGradient = (rank: string) => {
  // For text gradients, we need to handle this differently
  if (rank === 'Unicorn') {
    return 'linear-gradient(135deg, #7c3aed, #ec4899, #10b981)'
  }
  return getRankColor(rank)
}

const rankTiers = [
  { name: 'Trainee', min: 0, max: 499 },
  { name: 'Builder', min: 500, max: 749 },
  { name: 'Creator', min: 750, max: 999 },
  { name: 'Founder', min: 1000, max: 1249 },
  { name: 'Visionary', min: 1250, max: 1499 },
  { name: 'Icon', min: 1500, max: 1749 },
  { name: 'Titan', min: 1750, max: 1999 },
  { name: 'Unicorn', min: 2000, max: Infinity }
]

export default function LeaderboardClient({ 
  allUsers, 
  dailyHistory, 
  weeklyHistory, 
  monthlyHistory, 
  currentUserId, 
  currentUserStats 
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'weekly' | 'alltime'>('monthly')

  // Get unique users for each time period
  const getUniqueUsers = (history: EloHistory[], isPeriodGain: boolean = false) => {
    const uniqueUsers = new Map()
    history.forEach(entry => {
      if (!uniqueUsers.has(entry.user_id)) {
        uniqueUsers.set(entry.user_id, {
          elo: isPeriodGain ? entry.new_elo : entry.new_elo, // For period gains, new_elo contains the sum of elo_change
          user_id: entry.user_id,
          rank_label: entry.rank_label, // Preserve rank label from all-time ELO
          profiles: { username: entry.profiles.username },
          elo_change: entry.elo_change // Keep the original change for reference
        })
      }
    })
    return Array.from(uniqueUsers.values())
  }

  const getDisplayUsers = () => {
    switch (activeTab) {
      case 'daily':
        return getUniqueUsers(dailyHistory, true)
      case 'monthly':
        return getUniqueUsers(monthlyHistory, true)
      case 'weekly':
        return getUniqueUsers(weeklyHistory, true)
      case 'alltime':
        return allUsers
      default:
        return allUsers
    }
  }

  const displayUsers = getDisplayUsers()
  const currentUserRank = getRankByElo(currentUserStats?.elo)

  // Get top 10 users, then add current user if not in top 10 (only if authenticated)
  const top10Users = displayUsers.slice(0, 10)
  const currentUserInList = currentUserId ? displayUsers.find(user => user.user_id === currentUserId) : null
  
  let displayList = top10Users
  if (currentUserInList && !top10Users.find(user => user.user_id === currentUserId)) {
    displayList = [...top10Users, currentUserInList]
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
            Leaderboard
          </h1>
        </div>

        {/* Tab Switcher - Outside header to align with podium */}
        <div style={{ 
          marginBottom: '0px',
          display: 'flex',
          justifyContent: 'flex-start'
        }}>
          <div className="leaderboard-tabs" style={{ 
            background: 'var(--card)',
            borderRadius: '12px',
            padding: '8px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            display: 'inline-flex',
            minWidth: '320px'
          }}>
            {(['daily', 'monthly', 'alltime'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === tab ? 'var(--green)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text)',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize',
                  letterSpacing: '-0.3px',
                  boxShadow: activeTab === tab ? '0 2px 4px rgba(34, 197, 94, 0.2)' : 'none'
                }}
              >
                {tab === 'alltime' ? 'All-time' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="leaderboard-container">
          {/* Left Side - Leaderboard List */}
          <div className="leaderboard-main" style={{ marginTop: '-16px' }}>
            {/* Podium Section - Top 3 */}
            {displayUsers.length >= 3 && (
              <div style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'var(--card)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  alignItems: 'flex-end',
                  gap: '16px'
                }}>
                  {/* 2nd Place */}
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    {/* Position Tag */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: '#fff',
                      backgroundColor: '#C0C0C0',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      display: 'inline-block',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      2nd
                    </div>
                    <a
                      href={`/profile/${displayUsers[1].profiles.username}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: (() => {
                          const avatarColors: Record<string, string> = {
                            'avatar-1': '#6366F1', 'avatar-2': '#10B981', 'avatar-3': '#0EA5E9',
                            'avatar-4': '#F43F5E', 'avatar-5': '#F59E0B', 'avatar-6': '#8B5CF6',
                            'avatar-7': '#14B8A6', 'avatar-8': '#F97316', 'avatar-9': '#EC4899',
                            'avatar-10': '#3B82F6'
                          }
                          return avatarColors[displayUsers[1]?.profiles?.avatar] || '#6366F1'
                        })(),
                        color: '#fff',
                        fontSize: '32px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        border: '3px solid #C0C0C0',
                        boxShadow: '0 4px 12px rgba(192, 192, 192, 0.3)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                        margin: '0 auto 12px'
                      }}
                    >
                      {displayUsers[1].profiles.username.charAt(0).toUpperCase()}
                    </a>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                      marginBottom: '4px'
                    }}>
                      {displayUsers[1].profiles.username}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                      marginBottom: '4px'
                    }}>
                      {activeTab === 'daily' || activeTab === 'monthly' 
                        ? `${displayUsers[1].elo >= 0 ? '+' : ''}${displayUsers[1].elo}`
                        : displayUsers[1].elo}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: getRankColor(getRankByElo(allUsers.find(u => u.user_id === displayUsers[1].user_id)?.elo || 0)),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {getRankByElo(allUsers.find(u => u.user_id === displayUsers[1].user_id)?.elo || 0)}
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div style={{ textAlign: 'center', flex: 1, transform: 'translateY(-8px)' }}>
                    {/* Position Tag */}
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: '#fff',
                      backgroundColor: '#FFD700',
                      padding: '6px 16px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      display: 'inline-block',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
                    }}>
                      1st
                    </div>
                    <a
                      href={`/profile/${displayUsers[0].profiles.username}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100px',
                        height: '100px',
                        borderRadius: '20px',
                        background: (() => {
                          const avatarColors: Record<string, string> = {
                            'avatar-1': '#6366F1', 'avatar-2': '#10B981', 'avatar-3': '#0EA5E9',
                            'avatar-4': '#F43F5E', 'avatar-5': '#F59E0B', 'avatar-6': '#8B5CF6',
                            'avatar-7': '#14B8A6', 'avatar-8': '#F97316', 'avatar-9': '#EC4899',
                            'avatar-10': '#3B82F6'
                          }
                          return avatarColors[displayUsers[0]?.profiles?.avatar] || '#6366F1'
                        })(),
                        color: '#fff',
                        fontSize: '40px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        border: '3px solid #FFD700',
                        boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                        margin: '0 auto 12px'
                      }}
                    >
                      {displayUsers[0].profiles.username.charAt(0).toUpperCase()}
                    </a>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                      marginBottom: '4px'
                    }}>
                      {displayUsers[0].profiles.username}
                    {currentUserId && displayUsers[0]?.user_id === currentUserId && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: 'var(--green)',
                        fontWeight: '600'
                      }}>
                        (You)
                      </span>
                    )}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--green)',
                      marginBottom: '4px'
                    }}>
                      {activeTab === 'daily' || activeTab === 'monthly' 
                        ? `${displayUsers[0].elo >= 0 ? '+' : ''}${displayUsers[0].elo}`
                        : displayUsers[0].elo}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: getRankColor(getRankByElo(allUsers.find(u => u.user_id === displayUsers[0].user_id)?.elo || 0)),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {getRankByElo(allUsers.find(u => u.user_id === displayUsers[0].user_id)?.elo || 0)}
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    {/* Position Tag */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: '#fff',
                      backgroundColor: '#CD7F32',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      display: 'inline-block',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      3rd
                    </div>
                    <a
                      href={`/profile/${displayUsers[2].profiles.username}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: (() => {
                          const avatarColors: Record<string, string> = {
                            'avatar-1': '#6366F1', 'avatar-2': '#10B981', 'avatar-3': '#0EA5E9',
                            'avatar-4': '#F43F5E', 'avatar-5': '#F59E0B', 'avatar-6': '#8B5CF6',
                            'avatar-7': '#14B8A6', 'avatar-8': '#F97316', 'avatar-9': '#EC4899',
                            'avatar-10': '#3B82F6'
                          }
                          return avatarColors[displayUsers[2]?.profiles?.avatar] || '#6366F1'
                        })(),
                        color: '#fff',
                        fontSize: '32px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        border: '3px solid #CD7F32',
                        boxShadow: '0 4px 12px rgba(205, 127, 50, 0.3)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                        margin: '0 auto 12px'
                      }}
                    >
                      {displayUsers[2].profiles.username.charAt(0).toUpperCase()}
                    </a>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                      marginBottom: '4px'
                    }}>
                      {displayUsers[2].profiles.username}
                    {currentUserId && displayUsers[2]?.user_id === currentUserId && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: 'var(--green)',
                        fontWeight: '600'
                      }}>
                        (You)
                      </span>
                    )}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                      marginBottom: '4px'
                    }}>
                      {activeTab === 'daily' || activeTab === 'monthly' 
                        ? `${displayUsers[2].elo >= 0 ? '+' : ''}${displayUsers[2].elo}`
                        : displayUsers[2].elo}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#fff',
                      backgroundColor: getRankColor(getRankByElo(allUsers.find(u => u.user_id === displayUsers[2].user_id)?.elo || 0)),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {getRankByElo(allUsers.find(u => u.user_id === displayUsers[2].user_id)?.elo || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Column Headers */}
            <div className="leaderboard-table-headers">
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                fontFamily: 'var(--font-display)', 
                color: 'var(--text2)', 
                letterSpacing: '0.5px', 
                textTransform: 'uppercase'
              }}>
                Place
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                fontFamily: 'var(--font-display)', 
                color: 'var(--text2)', 
                letterSpacing: '0.5px', 
                textTransform: 'uppercase'
              }}>
                User
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                fontFamily: 'var(--font-display)', 
                color: 'var(--text2)', 
                letterSpacing: '0.5px', 
                textTransform: 'uppercase',
                textAlign: 'right'
              }}>
                ELO
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                fontFamily: 'var(--font-display)', 
                color: 'var(--text2)', 
                letterSpacing: '0.5px', 
                textTransform: 'uppercase',
                textAlign: 'right'
              }}>
                Rank
              </div>
            </div>

            {/* Rankings Table - Always show ranks 4-10 */}
          <div className="leaderboard-sidebar">
              {[4, 5, 6, 7, 8, 9, 10].map((rank) => {
                const user = displayUsers.find(u => displayUsers.indexOf(u) + 1 === rank)
                const isCurrentUser = currentUserId && user?.user_id === currentUserId
                
                if (user) {
                  // Real user data
                  const userRank = getRankByElo(user.elo)
                  const rankColor = getRankColor(userRank)
                  const totalElo = allUsers.find(u => u.user_id === user.user_id)?.elo || 0

                  return (
                    <div
                      key={user.user_id}
                      className="leaderboard-row"
                      style={{
                        background: isCurrentUser ? getRankFaintColor(userRank) : getRankFaintColor(userRank),
                        border: isCurrentUser ? '1px solid var(--green)' : '1px solid var(--border)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text)',
                        minWidth: '32px',
                        textAlign: 'center'
                      }}>
                        {rank}
                      </div>

                      {/* User Info - Avatar + Username */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1
                      }}>
                        {/* Avatar */}
                        <a
                          href={`/profile/${user.profiles.username}`}
                          style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: (() => {
                              const avatarColors: Record<string, string> = {
                                'avatar-1': '#6366F1', 'avatar-2': '#10B981', 'avatar-3': '#0EA5E9',
                                'avatar-4': '#F43F5E', 'avatar-5': '#F59E0B', 'avatar-6': '#8B5CF6',
                                'avatar-7': '#14B8A6', 'avatar-8': '#F97316', 'avatar-9': '#EC4899',
                                'avatar-10': '#3B82F6'
                              }
                              return avatarColors[user.profiles.avatar] || '#6366F1'
                            })(),
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {user.profiles.username.charAt(0).toUpperCase()}
                        </a>

                        {/* Username */}
                        <a
                          href={`/profile/${user.profiles.username}`}
                          style={{
                            textDecoration: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}
                        >
                          {user.profiles.username}
                          {isCurrentUser && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: 'var(--green)',
                              fontWeight: '600'
                            }}>
                              (You)
                            </span>
                          )}
                          {user.current_streak > 0 && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '14px',
                              color: 'var(--text2)',
                              fontWeight: '600'
                            }}>
                              🔥 {user.current_streak}
                            </span>
                          )}
                        </a>
                      </div>

                      {/* ELO (Period Gain) */}
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        color: (activeTab === 'daily' || activeTab === 'monthly') 
                          ? (user.elo >= 0 ? 'var(--green)' : 'var(--red)') 
                          : 'var(--green)',
                        letterSpacing: '-0.2px',
                        textAlign: 'right',
                        minWidth: '80px'
                      }}>
                        {activeTab === 'daily' || activeTab === 'monthly' 
                          ? `${user.elo >= 0 ? '+' : ''}${user.elo}` 
                          : user.elo}
                      </div>

                      {/* Rank (Overall) */}
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text)',
                        textAlign: 'right',
                        minWidth: '80px'
                      }}>
                        {getRankByElo(allUsers.find(u => u.user_id === user.user_id)?.elo || 0)}
                      </div>
                    </div>
                  )
                } else {
                  // Placeholder for empty position
                  return (
                    <div
                      key={rank}
                      className="leaderboard-row"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        opacity: 0.5
                      }}
                    >
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text2)',
                        minWidth: '32px',
                        textAlign: 'center'
                      }}>
                        {rank}
                      </div>

                      {/* User Info - Empty placeholder */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1
                      }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--text2)',
                          letterSpacing: '-0.1px'
                        }}>
                          --
                        </div>
                      </div>

                      {/* ELO placeholder */}
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text2)',
                        letterSpacing: '-0.2px',
                        textAlign: 'right',
                        minWidth: '80px'
                      }}>
                        --
                      </div>

                      {/* Rank placeholder */}
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text2)',
                        textAlign: 'right',
                        minWidth: '80px'
                      }}>
                        --
                      </div>
                    </div>
                  )
                }
              })}

              {/* Pinned User Position (if logged in and outside top 10) */}
              {currentUserId && (() => {
                const currentUserInList = displayUsers.find(user => user.user_id === currentUserId)
                const currentUserRank = currentUserInList ? displayUsers.indexOf(currentUserInList) + 1 : null
                
                if (currentUserRank && currentUserRank > 10) {
                  const user = currentUserInList
                  const userRank = getRankByElo(user.elo)
                  const rankColor = getRankColor(userRank)
                  const totalElo = allUsers.find(u => u.user_id === user.user_id)?.elo || 0

                  return (
                    <>
                      {/* Divider */}
                      <div style={{
                        height: '1px',
                        background: 'var(--border)',
                        margin: '16px 0'
                      }} />
                      
                      {/* Current User Pinned Position */}
                      <div
                        className="leaderboard-row"
                        style={{
                          background: getRankFaintColor(userRank),
                          border: '2px solid var(--green)',
                          transition: 'all 0.2s ease',
                          position: 'sticky',
                          bottom: '0'
                        }}
                      >
                        {/* Rank Number */}
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--green)',
                          minWidth: '32px',
                          textAlign: 'center'
                        }}>
                          {currentUserRank}
                        </div>

                        {/* User Info - Avatar + Username */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1
                        }}>
                          {/* Avatar */}
                          <a
                            href={`/profile/${user.profiles.username}`}
                            style={{
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: (() => {
                                const avatarColors: Record<string, string> = {
                                  'avatar-1': '#6366F1', 'avatar-2': '#10B981', 'avatar-3': '#0EA5E9',
                                  'avatar-4': '#F43F5E', 'avatar-5': '#F59E0B', 'avatar-6': '#8B5CF6',
                                  'avatar-7': '#14B8A6', 'avatar-8': '#F97316', 'avatar-9': '#EC4899',
                                  'avatar-10': '#3B82F6'
                                }
                                return avatarColors[user.profiles.avatar] || '#6366F1'
                              })(),
                              color: '#fff',
                              fontSize: '16px',
                              fontWeight: '800',
                              fontFamily: 'var(--font-display)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            {user.profiles.username.charAt(0).toUpperCase()}
                          </a>

                          {/* Username */}
                          <a
                            href={`/profile/${user.profiles.username}`}
                            style={{
                              textDecoration: 'none',
                              fontSize: '16px',
                              fontWeight: '700',
                              fontFamily: 'var(--font-display)',
                              color: 'var(--text)',
                              letterSpacing: '-0.1px'
                            }}
                          >
                            {user.profiles.username}
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              color: 'var(--green)',
                              fontWeight: '600'
                            }}>
                              (You)
                            </span>
                          </a>
                        </div>

                        {/* ELO Gain */}
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-display)',
                          color: (activeTab === 'daily' || activeTab === 'monthly') 
                            ? (user.elo >= 0 ? 'var(--green)' : 'var(--red)') 
                            : 'var(--green)',
                          letterSpacing: '-0.2px',
                          textAlign: 'right',
                          minWidth: '80px'
                        }}>
                          {activeTab === 'daily' || activeTab === 'monthly' 
                            ? `${user.elo >= 0 ? '+' : ''}${user.elo}` 
                            : user.elo}
                        </div>

                        {/* Rank (Overall) */}
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--text)',
                          textAlign: 'right',
                          minWidth: '80px'
                        }}>
                          {getRankByElo(allUsers.find(u => u.user_id === user.user_id)?.elo || 0)}
                        </div>
                      </div>
                    </>
                  )
                }
                return null
              })()}
            </div>
          </div>

          {/* Right Side - User Stats Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '-16px' }}>
            
            {/* Current User Stats - Show breakdown if authenticated, CTA if logged out */}
            {currentUserId ? (
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '36px', 
                    fontWeight: '800', 
                    color: getRankColor(currentUserRank), 
                    fontFamily: 'var(--font-display)',
                    marginBottom: '8px'
                  }}>
                    {currentUserRank}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text2)',
                    fontWeight: '600',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                  }}>
                    Your Rank
                  </div>
                </div>
                
                <div style={{ 
                  height: '1px', 
                  background: 'var(--border)', 
                  margin: '20px 0' 
                }} />
                
                {/* ELO Breakdown */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--text)', 
                    marginBottom: '16px',
                    letterSpacing: '-0.1px',
                    textAlign: 'center'
                  }}>
                    Your ELO Breakdown
                  </div>
                  
                  {/* Daily ELO */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.1)'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      Daily
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: 'var(--green)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {(() => {
                        const dailyUser = dailyHistory.find(u => u.user_id === currentUserId)
                        const gain = dailyUser ? dailyUser.elo_change : 0
                        return `${gain >= 0 ? '+' : ''}${gain}`
                      })()}
                    </span>
                  </div>
                  
                  {/* Monthly ELO */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      Monthly
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#3b82f6',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {(() => {
                        const monthlyUser = monthlyHistory.find(u => u.user_id === currentUserId)
                        const gain = monthlyUser ? monthlyUser.elo_change : 0
                        return `${gain >= 0 ? '+' : ''}${gain}`
                      })()}
                    </span>
                  </div>
                  
                  {/* All-time ELO */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.1)'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      All-time
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#8b5cf6',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {currentUserStats?.elo || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* CTA for logged out users */
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '20px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: '800', 
                    color: 'var(--text)', 
                    fontFamily: 'var(--font-display)',
                    marginBottom: '8px'
                  }}>
                    📊
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: 'var(--text)', 
                    fontFamily: 'var(--font-display)',
                    marginBottom: '8px',
                    letterSpacing: '-0.5px'
                  }}>
                    Track Your Stats
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text2)',
                    fontWeight: '400',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '1.4',
                    marginBottom: '16px'
                  }}>
                    Sign in to see your ELO breakdown and compete for the top spot!
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href="/login"
                    className="btn-cta-primary"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      textAlign: 'center',
                      padding: '10px 16px',
                      fontSize: '14px'
                    }}
                  >
                    Sign In
                  </a>
                  <a
                    href="https://bizyip.com/login?mode=signup"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      textAlign: 'center',
                      padding: '10px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: 'var(--font-display)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--green)'
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.borderColor = 'var(--green)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    Create Account
                  </a>
                </div>
              </div>
            )}

            {/* Rank Tiers */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                fontFamily: 'var(--font-display)', 
                color: 'var(--text)', 
                marginBottom: '20px',
                letterSpacing: '-0.1px'
              }}>
                Rank Tiers
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rankTiers.map((tier) => {
                  const isCurrentTier = currentUserId && currentUserRank === tier.name
                  const tierColor = getRankColor(tier.name)
                  
                  return (
                    <div
                      key={tier.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: getRankFaintColor(tier.name),
                        border: isCurrentTier ? 'none' : `1px solid ${tierColor}20`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        fontSize: isCurrentTier ? '15px' : '14px',
                        fontWeight: isCurrentTier ? '800' : '700',
                        fontFamily: 'var(--font-display)',
                        color: isCurrentTier ? '#fff' : (tier.name === 'Builder' ? '#1e40af' : tierColor),
                        letterSpacing: '-0.1px'
                      }}>
                        {tier.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-display)',
                        color: isCurrentTier ? '#fff' : 'var(--text2)',
                        letterSpacing: '0.5px'
                      }}>
                        {tier.min === 0 ? `0-${tier.max}` : tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
