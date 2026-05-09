'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import EloPopup from '@/components/EloPopup'
import { containsBannedWord, validateAndLogContent } from '@/lib/moderation'

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

interface Submission {
  id: string
  content: string
  username: string
  display_name: string
  created_at: string
  likes: number
  user_liked: boolean
  user_id: string
}

interface DailyBattleClientProps {
  battle: DailyBattle | null
  userSubmission: UserSubmission | null
  userStreak: DailyStreak | null
  userId: string
}

export default function DailyBattleClient({ battle, userSubmission, userStreak, userId }: DailyBattleClientProps) {
  const { user, username, authLoading } = useUser()
  const [submission, setSubmission] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEloPopup, setShowEloPopup] = useState(false)
  const [eloPopupMessage, setEloPopupMessage] = useState('')
  const [localUserSubmission, setLocalUserSubmission] = useState<UserSubmission | null>(userSubmission)
  const [localUserStreak, setLocalUserStreak] = useState<DailyStreak | null>(userStreak)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setLocalUserSubmission(userSubmission)
    fetchSubmissions()
  }, [userSubmission])

  useEffect(() => {
    if (userStreak) {
      setLocalUserStreak(userStreak)
    }
  }, [userStreak])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/compete/daily-battle/api/submissions?battleId=${battle?.id || ''}`)
      if (!response.ok) throw new Error('Failed to fetch submissions')
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!submission.trim() || submission.length > 500) return

    // Check for banned words
    if (containsBannedWord(submission)) {
      setModerationError('Inappropriate content. Please rewrite.')
      return
    }

    setModerationError(null)

    try {
      setSubmitting(true)
      
      // Log moderation check and validate
      const moderationResult = await validateAndLogContent(userId, submission.trim(), 'daily_bellringer')
      if (!moderationResult.isValid) {
        setModerationError(moderationResult.error || 'Inappropriate content. Please rewrite.')
        return
      }
      
      const response = await fetch('/compete/daily-battle/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: battle?.id || '',
          content: submission.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      const data = await response.json()
      setEloPopupMessage(`+${data.eloGained || 0} ELO`)
      setShowEloPopup(true)
      
      // Update local state immediately
      if (data.streak) {
        setLocalUserStreak({
          current_streak: data.streak.current_streak,
          longest_streak: data.streak.longest_streak,
          last_submission_date: new Date().toISOString()
        })
      }
      
      // Set local user submission
      const newSubmission: UserSubmission = {
        id: data.submissionId || Date.now().toString(),
        content: submission.trim(),
        created_at: new Date().toISOString()
      }
      setLocalUserSubmission(newSubmission)
      
      // Clear submission and refresh
      setSubmission('')
      setTimeout(() => fetchSubmissions(), 1000)
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (submissionId: string, currentlyLiked: boolean) => {
    // Optimistic update - update UI immediately
    const originalSubmissions = [...submissions]
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { ...sub, likes: currentlyLiked ? sub.likes - 1 : sub.likes + 1, user_liked: !currentlyLiked }
        : sub
    ))

    try {
      const response = await fetch('/compete/daily-battle/api/likes', {
        method: currentlyLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      if (!response.ok) {
        // Revert optimistic update if API call fails
        setSubmissions(originalSubmissions)
        throw new Error('Failed to update like')
      }

      // API succeeded - optimistic update remains
    } catch (error) {
      console.error('Error updating like:', error)
      // Revert optimistic update on network error
      setSubmissions(originalSubmissions)
    }
  }

  const getStreakMessage = () => {
    if (!userStreak) return "Start your streak today!"
    if (userSubmission) return "Streak maintained! ✅"
    return "Submit today to keep your streak!"
  }

  const getStreakELO = (streak: number) => {
    if (streak === 0) return 0
    if (streak === 1) return 1
    if (streak <= 6) return 3
    return 5
  }

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '0 0 48px 0'
      }}>
        {/* Header skeleton */}
        <div style={{ 
          padding: '32px 24px 24px 24px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              width: '200px',
              height: '48px',
              background: 'var(--border)',
              borderRadius: '8px',
              animation: 'pulse 2s infinite'
            }} />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            {/* Main content skeleton */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '80%',
                height: '32px',
                background: 'var(--border)',
                borderRadius: '8px',
                animation: 'pulse 2s infinite',
                marginBottom: '24px'
              }} />
              <div style={{
                width: '100%',
                height: '200px',
                background: 'var(--border)',
                borderRadius: '12px',
                animation: 'pulse 2s infinite',
                marginBottom: '24px'
              }} />
              <div style={{
                width: '120px',
                height: '48px',
                background: 'var(--border)',
                borderRadius: '8px',
                animation: 'pulse 2s infinite'
              }} />
            </div>
            
            {/* Side panel skeleton */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                width: '120px',
                height: '24px',
                background: 'var(--border)',
                borderRadius: '6px',
                animation: 'pulse 2s infinite',
                marginBottom: '20px'
              }} />
              <div style={{
                width: '80px',
                height: '32px',
                background: 'var(--border)',
                borderRadius: '6px',
                animation: 'pulse 2s infinite',
                marginBottom: '16px'
              }} />
              <div style={{
                width: '100px',
                height: '16px',
                background: 'var(--border)',
                borderRadius: '4px',
                animation: 'pulse 2s infinite'
              }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show sign-in banner for non-authenticated users
  if (!user) {
    return (
      <>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
        <div style={{ 
          minHeight: '100vh',
          background: 'var(--bg)',
          backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          padding: '0 0 48px 0'
        }}>
        {/* Header */}
        <div style={{ 
          padding: '32px 24px 24px 24px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
              Daily Bellringer
            </h1>
          </div>
        </div>

        <div className="daily-battle-container">
          {/* Main Content */}
          <div className="daily-battle-main">
            {/* Today's Prompt */}
            <div className="daily-battle-prompt">
              <h2>
                Today's Prompt
              </h2>
              <p>
                {battle?.prompt || 'No prompt yet today — be creative! 🎨'}
              </p>
            </div>

            {/* Sign-in banner instead of submission form */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
                Sign in to submit your answer
              </div>
              <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
                Join the community and share your response to today's prompt.
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
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)'
                }}
              >
                Sign In
              </Link>
            </div>

            {/* Public submissions - show to everyone */}
            <div style={{
              background: 'var(--card)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Community Submissions
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  Loading submissions...
                </div>
              ) : submissions.length > 0 ? (
                <div className="daily-battle-submissions-grid">
                  {submissions.map(submission => (
                    <div key={submission.id} style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--green)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}>
                      {/* Author */}
                      <div style={{ marginBottom: '12px' }}>
                        <Link 
                          href={`/profile/${submission.username}`} 
                          style={{
                            fontSize: '13px',
                            color: 'var(--blue)',
                            textDecoration: 'none',
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none'
                          }}
                        >
                          @{submission.username}
                        </Link>
                      </div>

                      {/* Content */}
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text2)',
                        marginBottom: '16px',
                        lineHeight: 1.5
                      }}>
                        {submission.content}
                      </p>

                      {/* Stats */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '13px',
                          color: 'var(--text3)'
                        }}>
                          <div>{new Date(submission.created_at).toLocaleDateString()}</div>
                        </div>
                        
                        {/* Like button disabled for non-authenticated users */}
                        <div
                          style={{
                            background: 'var(--border)',
                            color: 'var(--text3)',
                            border: '1px solid var(--border)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            fontFamily: 'var(--font-body)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: 0.6
                          }}
                        >
                          <span>👍</span>
                          <span>{submission.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No submissions yet — be the first to share!
                </div>
              )}
            </div>
          </div>

          {/* Right Side Panel - Public Info */}
          <div className="daily-battle-sidebar">
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 Daily Streak
              </h3>
              
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Sign in to start your streak and earn ELO rewards!
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                  Streak ELO Breakdown
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Day 1:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+1 ELO</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Days 2-6:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+3 ELO</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Days 7+:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+5 ELO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '0 0 48px 0'
      }}>
      {/* Header */}
      <div style={{ 
        padding: '32px 24px 24px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
            Daily Bellringer
          </h1>
        </div>
      </div>

      <div className="daily-battle-container">
        {/* Main Content */}
        <div className="daily-battle-main">
        {/* ELO Popup */}
        <EloPopup message={eloPopupMessage} show={showEloPopup} />

        {/* Today's Prompt */}
        <div className="daily-battle-prompt">
          <h2>
            Today's Prompt
          </h2>
          <p>
            {battle?.prompt || 'No prompt yet today — be creative! 🎨'}
          </p>
        </div>

        {/* Not Submitted State */}
        {!localUserSubmission ? (
          <div className="daily-battle-submit-area">
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={submission}
                onChange={(e) => {
                  setSubmission(e.target.value.slice(0, 500))
                  setModerationError(null) // Clear error when user types
                }}
                placeholder="Share your response..."
                maxLength={500}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical',
                  background: 'var(--background)',
                  color: 'var(--text-primary)'
                }}
              />
              {moderationError && (
                <p style={{ color: '#fca5a5', marginTop: '8px', marginBottom: 0, fontSize: '14px' }}>
                  {moderationError}
                </p>
              )}
              <div style={{
                textAlign: 'right',
                marginTop: '8px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                {submission.length}/500
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!submission.trim() || submitting}
              className="daily-battle-submit-button"
              style={{
                background: submission.trim() && !submitting ? 'var(--green)' : 'var(--border)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: submission.trim() && !submitting ? 'pointer' : 'not-allowed',
                opacity: submission.trim() && !submitting ? 1 : 0.6
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        ) : (
          /* Submitted State - Show Submissions */
          <div>
            {/* User's Submission */}
            <div style={{
              background: 'var(--card)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '2px solid var(--green)'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <Link href={`/profile/${username || userId}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>Your Submission</span>
                </Link>
              </div>
              <p style={{ fontSize: '16px', lineHeight: '1.4', marginBottom: '12px' }}>
                {localUserSubmission.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {submissions.find(s => s.id === localUserSubmission.id)?.likes || 0} likes
                </span>
              </div>
            </div>

            {/* Other Submissions Section */}
            <div style={{
              background: 'var(--card)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Other Submissions
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  Loading submissions...
                </div>
              ) : localUserSubmission ? (
                (() => {
                  const filteredSubmissions = submissions.filter(s => s.user_id !== userId)
                  return filteredSubmissions.length > 0 ? (
                    <div className="daily-battle-submissions-grid">
                      {submissions.filter(s => {
                    console.log('Filtering submission:', s.user_id, 'vs userId:', userId, 'match:', s.user_id === userId)
                    return s.user_id !== userId
                  }).map(submission => (
                        <div key={submission.id} style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--green)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = 'var(--shadow)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                          {/* Author */}
                          <div style={{ marginBottom: '12px' }}>
                            <Link 
                              href={`/profile/${submission.username}`} 
                              style={{
                                fontSize: '13px',
                                color: 'var(--blue)',
                                textDecoration: 'none',
                                fontWeight: 500
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = 'underline'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = 'none'
                              }}
                            >
                              @{submission.username}
                            </Link>
                          </div>

                          {/* Content */}
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--text2)',
                            marginBottom: '16px',
                            lineHeight: 1.5
                          }}>
                            {submission.content}
                          </p>

                          {/* Stats and Like Button */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end'
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '16px',
                              fontSize: '13px',
                              color: 'var(--text3)'
                            }}>
                              <div>{new Date(submission.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <button
                              onClick={() => handleLike(submission.id, submission.user_liked)}
                              disabled={submission.user_id === user?.id}
                              style={{
                                background: submission.user_id === user?.id ? 'var(--border)' : (submission.user_liked ? 'var(--green)' : 'var(--card2)'),
                                color: submission.user_id === user?.id ? 'var(--text3)' : (submission.user_liked ? 'white' : 'var(--text)'),
                                border: '1px solid var(--border)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: submission.user_id === user?.id ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-body)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: submission.user_id === user?.id ? 0.6 : 1
                              }}
                            >
                              <span>{submission.user_id === user?.id ? '👍' : (submission.user_liked ? '👍' : '👍')}</span>
                              <span>{submission.likes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No other submissions yet — you're the first! 🎉
                    </div>
                  )
                })()
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  Submit your answer to see others' responses!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Right Side Panel - Streak Info */}
        <div className="daily-battle-sidebar">
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔥 Your Streak
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {localUserStreak?.current_streak || 0} days
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Longest: {localUserStreak?.longest_streak || 0} days
            </div>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {getStreakMessage()}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Streak ELO Breakdown
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Day 1:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+1 ELO</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Days 2-6:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+3 ELO</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Days 7+:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>+5 ELO</span>
              </div>
            </div>
            {localUserStreak && localUserStreak.current_streak > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'var(--background)',
                borderRadius: '6px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Next submission: <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>
                  +{getStreakELO(localUserStreak.current_streak + 1)} ELO
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
