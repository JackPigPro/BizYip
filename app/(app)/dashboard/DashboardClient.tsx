'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/SupabaseProvider'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/utils/supabase/client'
import ProfileCompletionPopup from '@/components/ProfileCompletionPopup'

interface Notification {
  id: string
  type: 'idea_liked' | 'idea_commented' | 'comment_replied' | 'cofounder_request_received' | 'cofounder_request_accepted' | 'new_message'
  title: string
  body: string
  read: boolean
  created_at: string
}

interface DashboardClientProps {
  initialProfile: { username: string, display_name: string | null, created_at: string } | null
  initialStats: { elo: number, rank: string } | null
  todayBattle: any | null
  userSubmission: any | null
  userStreak: {
    current_streak: number
    longest_streak: number
    last_submission_date: string | null
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
    case 'Trainee': return '#9ca3af'
    case 'Builder': return '#2563eb'
    case 'Creator': return '#16a34a'
    case 'Founder': return '#ca8a04'
    case 'Visionary': return '#7c3aed'
    case 'Icon': return '#ea580c'
    case 'Titan': return '#dc2626'
    case 'Unicorn': return 'linear-gradient(135deg, #7c3aed, #ec4899, #10b981)'
    default: return '#9ca3af'
  }
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'idea_liked': return '❤️'
    case 'idea_commented': return '💬'
    case 'comment_replied': return '↩️'
    case 'cofounder_request_received': return '👋'
    case 'cofounder_request_accepted': return '🎉'
    case 'new_message': return '✉️'
    default: return '🔔'
  }
}

const getTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function DashboardClient({ initialProfile, initialStats, todayBattle, userSubmission, userStreak }: DashboardClientProps) {
  const { user, authLoading, profile: userProfile } = useUser()
  const [profile, setProfile] = useState<any>(initialProfile)
  const [elo, setElo] = useState<any>(initialStats)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [activityPage, setActivityPage] = useState(1)
  const [hasMoreActivity, setHasMoreActivity] = useState(true)
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false)
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false)

  const userElo = elo?.elo || 0
  const userRank = getRankByElo(userElo)
  const rankColor = getRankColor(userRank)
  const isAuthenticated = !!user
  const username = userProfile?.username || profile?.username
  const display_name = userProfile?.display_name || profile?.display_name

  // Fetch notifications with pagination
  useEffect(() => {
    if (isAuthenticated) {
      fetchActivity(1, true)
      checkProfileCompletionNudge()
    } else if (!authLoading) {
      setNotificationsLoading(false)
    }
  }, [isAuthenticated, authLoading])

  // Check if profile completion nudge should be shown
  const checkProfileCompletionNudge = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // First check if we've already dismissed this popup in localStorage
      const localStorageKey = `profile_completion_nudge_dismissed_${user.id}`
      if (localStorage.getItem(localStorageKey)) {
        return // Already dismissed in localStorage, don't show
      }

      // Try to check database field first, but handle the case where it doesn't exist
      let profileData: any = null
      let fieldExists = false

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_completion_nudge_shown, created_at')
          .eq('id', user.id)
          .single()
        
        if (!error) {
          profileData = data
          fieldExists = true
        }
      } catch (err) {
        // Field doesn't exist, will fall back to created_at only
      }

      if (!fieldExists) {
        // Fall back to just checking account age
        try {
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .single()

          if (fallbackData) {
            const createdAt = new Date(fallbackData.created_at)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            
            if (createdAt > sevenDaysAgo) {
              setShowProfileCompletionPopup(true)
            }
          }
        } catch (fallbackError) {
          console.log('Could not fetch profile data for nudge check')
        }
        return
      }

      // If we have the database field, check it
      if (profileData && !profileData.profile_completion_nudge_shown) {
        // Check if user is relatively new (created within last 7 days)
        const createdAt = new Date(profileData.created_at)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        if (createdAt > sevenDaysAgo) {
          setShowProfileCompletionPopup(true)
        }
      }
    } catch (error) {
      console.error('Error checking profile completion nudge:', error)
    }
  }

  // Handle popup dismissal and update database (only if field exists)
  const handleProfileCompletionPopupDismiss = async () => {
    setShowProfileCompletionPopup(false)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Always store in localStorage as backup
        const localStorageKey = `profile_completion_nudge_dismissed_${user.id}`
        localStorage.setItem(localStorageKey, 'true')
        
        // Try to update the nudge field in database
        const { error } = await supabase
          .from('profiles')
          .update({ profile_completion_nudge_shown: true })
          .eq('id', user.id)
        
        if (error) {
          console.log('Could not update profile completion nudge flag (field may not exist yet):', error.message)
        }
      }
    } catch (error) {
      console.error('Error updating profile completion nudge flag:', error)
    }
  }

  const fetchActivity = async (page: number, reset: boolean = false) => {
    try {
      if (reset) {
        setNotificationsLoading(true)
      } else {
        setLoadingMoreActivity(true)
      }

      const response = await fetch(`/dashboard/api/activity?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setNotifications(data.activity || [])
        } else {
          setNotifications(prev => [...prev, ...(data.activity || [])])
        }
        
        setHasMoreActivity(data.pagination?.hasMore || false)
        setActivityPage(page)
      } else if (response.status === 500 || response.status === 401) {
        // Handle server errors gracefully - just set empty notifications
        console.log('Activity feed temporarily unavailable')
        if (reset) {
          setNotifications([])
        }
        setHasMoreActivity(false)
      } else {
        console.error('Unexpected response status:', response.status)
        if (reset) {
          setNotifications([])
        }
        setHasMoreActivity(false)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
      // Set empty state on error to prevent infinite loading
      if (reset) {
        setNotifications([])
      }
      setHasMoreActivity(false)
    } finally {
      setNotificationsLoading(false)
      setLoadingMoreActivity(false)
    }
  }

  const loadMoreActivity = () => {
    if (hasMoreActivity && !loadingMoreActivity) {
      fetchActivity(activityPage + 1, false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Show loading skeleton while auth is loading
  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 800, 
            letterSpacing: '-2px', 
            fontFamily: 'var(--font-display)', 
            color: 'var(--text)', 
            marginBottom: '32px',
            background: 'var(--border)',
            width: '200px',
            height: '48px',
            borderRadius: '8px'
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                height: '200px'
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: '16px', 
          padding: '48px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            Please Log In
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            You need to be logged in to view your dashboard.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--green)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)'
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    )
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
        <div style={{ marginBottom: '32px' }} className="dashboard-header-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="dashboard-header">
            <div className="dashboard-header-title">
              Dashboard
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 800, 
              letterSpacing: '-2px', 
              fontFamily: 'var(--font-display)', 
              color: 'var(--text)', 
              margin: 0 
            }}>
              {userStreak?.current_streak && userStreak.current_streak > 0 ? `${userStreak.current_streak}🔥` : '0🔥'}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="dashboard-subheader">
          Welcome back, {display_name || username || 'User'}!
        </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '400', 
              fontFamily: 'var(--font-body)', 
              color: 'var(--text2)' 
            }}>
              {userStreak?.current_streak && userStreak.current_streak > 0 ? (
                'Continue your streak in Daily Battle!'
              ) : (
                'Start your streak today in Daily Battle!'
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Top Left - Player Stats */}
          <div className="dashboard-card">
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '24px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              letterSpacing: '-0.1px'
            }}>
              Player Stats
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 800, 
                  color: 'var(--green)', 
                  fontFamily: 'var(--font-display)',
                  marginBottom: '8px',
                  letterSpacing: '-1px'
                }}>
                  {userElo}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--text2)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  ELO Rating
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 800, 
                  color: rankColor,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '8px',
                  letterSpacing: '-0.5px'
                }}>
                  {userRank}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--text2)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  Current Rank
                </div>
              </div>
            </div>
            
            <div style={{ 
              height: '1px', 
              background: 'var(--border)', 
              margin: '24px 0' 
            }} />
            
            <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Username:</strong> @{username}
              </div>
              {display_name && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Display Name:</strong> {display_name}
                </div>
              )}
              <div>
                <strong>Member Since:</strong> {profile?.created_at ? formatDate(profile.created_at) : (
                  <span style={{
                    display: 'inline-block',
                    height: '14px',
                    background: 'var(--border)',
                    borderRadius: '4px',
                    width: '80px',
                    verticalAlign: 'middle'
                  }} />
                )}
              </div>
            </div>
          </div>

          {/* Top Right - Recent Activity */}
          <div className="dashboard-card">
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '24px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              letterSpacing: '-0.1px'
            }}>
              Recent Activity
            </h2>
            
            {notificationsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading activity...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                <p>No recent activity</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Start sharing ideas and competing to see your activity here!</p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '12px',
                      background: notification.read ? 'var(--surface)' : 'var(--green-tint)',
                      border: notification.read ? '1px solid var(--border)' : '1px solid var(--green)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{getNotificationIcon(notification.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '700', 
                        fontFamily: 'var(--font-display)', 
                        fontSize: '14px', 
                        marginBottom: '4px',
                        color: 'var(--text)',
                        letterSpacing: '-0.1px'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{ 
                        color: 'var(--text2)', 
                        fontSize: '13px', 
                        lineHeight: '1.4',
                        fontFamily: 'var(--font-body)'
                      }}>
                        {notification.body}
                      </div>
                      <div style={{ 
                        color: 'var(--text2)', 
                        fontSize: '11px', 
                        marginTop: '8px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                      }}>
                        {getTimeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Infinite scroll trigger */}
                {hasMoreActivity && (
                  <div 
                    style={{ textAlign: 'center', padding: '20px' }}
                    onClick={loadMoreActivity}
                  >
                    {loadingMoreActivity ? (
                      <div style={{ color: 'var(--text2)' }}>Loading more activity...</div>
                    ) : (
                      <button
                        style={{
                          padding: '8px 16px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text2)',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-display)'
                        }}
                      >
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Left - Daily Battle */}
          <div className="dashboard-card">
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '24px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              letterSpacing: '-0.1px'
            }}>
              Daily Battle
            </h2>
            
            {todayBattle ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text2)', 
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)'
                  }}>
                    Today's Prompt
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: 'var(--text)', 
                    lineHeight: '1.4',
                    fontFamily: 'var(--font-body)'
                  }}>
                    {todayBattle.prompt.length > 60 
                      ? todayBattle.prompt.substring(0, 60) + '...'
                      : todayBattle.prompt
                    }
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Current Streak 🔥</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {userStreak?.current_streak || 0} days
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: userSubmission ? 'var(--green)' : 'var(--text2)', fontFamily: 'var(--font-display)' }}>
                      {userSubmission ? 'Submitted ✓' : 'Not submitted'}
                    </div>
                  </div>
                </div>
                
                <Link
                  href="/compete/daily-battle"
                  prefetch={true}
                  style={{
                    display: 'block',
                    padding: '12px 20px',
                    background: 'var(--green)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#22c55e'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--green)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Battle Today →
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  No battle today
                </div>
              </div>
            )}
          </div>

          
          {/* Bottom Right - Quick Actions */}
          <div className="dashboard-card">
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '24px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              letterSpacing: '-0.1px'
            }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/connect/ideas"
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  background: 'var(--green)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#22c55e'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--green)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                📝 Share an Idea
              </Link>
              <Link
                href="/compete/weekly-duel"
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  background: 'var(--blue)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b82f6'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--blue)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                ⚔️ Weekly Duel
              </Link>
              <Link
                href="/connect/cofounder-match"
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  background: 'var(--purple)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#a855f7'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--purple)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                👋 Find Co-founders
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Completion Popup */}
      {showProfileCompletionPopup && username && (
        <ProfileCompletionPopup
          onDismiss={handleProfileCompletionPopupDismiss}
          username={username}
        />
      )}
    </div>
  )
}
