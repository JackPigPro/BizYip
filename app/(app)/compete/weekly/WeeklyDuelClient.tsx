'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import EloPopup from '@/components/EloPopup'
import { containsBannedWord, validateAndLogContent } from '@/lib/moderation'

interface WeeklyDuel {
  id: string
  prompt: string
  start_date: string
  end_date: string
  status: 'active' | 'voting' | 'completed' | 'between'
  prize_distributed: boolean
}

interface UserSubmission {
  id: string
  content: string
  vote_score: number
  vote_count: number
  created_at: string
  user_id: string
  final_rank?: number
  elo_awarded?: number
}

interface Winner {
  id: string
  rank: number
  elo_awarded: number
  user_id: {
    username: string
  }
  created_at: string
}

interface WeeklyDuelClientProps {
  currentDuel: WeeklyDuel | null
  userSubmission: UserSubmission | null
  allSubmissions: UserSubmission[]
  pastWinners: Winner[]
  currentState: 'active' | 'voting' | 'results' | 'between'
  submissionDeadline: Date | null
  votingDeadline: Date | null
  currentUserId: string

  // Ensure votingDeadline is properly parsed as Date object
  parsedVotingDeadline: Date | null
  onRefresh?: () => void
  onSubmissionSuccess?: (newSubmission: UserSubmission) => void
}

export default function WeeklyDuelClient({
  currentDuel,
  userSubmission,
  allSubmissions,
  pastWinners,
  currentState,
  submissionDeadline,
  votingDeadline,
  parsedVotingDeadline,
  currentUserId,
  onRefresh,
  onSubmissionSuccess
}: WeeklyDuelClientProps) {
  const supabase = createClient()
  const [submissionContent, setSubmissionContent] = useState('')
  const [validationError, setValidationError] = useState('')
  const [voteCooldown, setVoteCooldown] = useState(0)
  const [votedPairs, setVotedPairs] = useState(new Set<string>())
  const [currentPair, setCurrentPair] = useState<{ a: string; b: string } | null>(null)
  const [eloChange, setEloChange] = useState<number | null>(null)
  const [adminPreviewState, setAdminPreviewState] = useState<'active' | 'voting' | 'results'>(currentState === 'between' ? 'active' : currentState)
  const [hasSubmittedPreview, setHasSubmittedPreview] = useState(false)
  const [localUserSubmission, setLocalUserSubmission] = useState<UserSubmission | null>(userSubmission)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editValidationError, setEditValidationError] = useState('')
  const [showEloPopup, setShowEloPopup] = useState(false)
  const [eloPopupMessage, setEloPopupMessage] = useState('')
  const [moderationError, setModerationError] = useState<string | null>(null)

  // Check if user is admin
  const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'
  const isAdmin = currentUserId === ADMIN_USER_ID

  // Get current state (admin override or real state)
  const displayState = isAdmin ? adminPreviewState : currentState
  const displayUserSubmission = isAdmin && hasSubmittedPreview ? { id: 'preview', content: 'Preview submission', vote_score: 0, vote_count: 0, created_at: new Date().toISOString() } as UserSubmission : localUserSubmission
  console.log('displayUserSubmission:', displayUserSubmission, 'userSubmission:', userSubmission)

  // Countdown timers
  useEffect(() => {
    if (!submissionDeadline) return

    const timer = setInterval(() => {
      const now = new Date()
      const timeLeft = submissionDeadline.getTime() - now.getTime()
      
      if (timeLeft <= 0) {
        clearInterval(timer)
        return
      }
      
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      
      let timeString = ''
      if (days > 0) {
        timeString += `${days} day${days === 1 ? '' : 's'} `
      }
      if (days > 0 || hours > 0) {
        timeString += `${hours} hour${hours === 1 ? '' : 's'} `
      }
      if (days > 0 || hours > 0 || minutes > 0) {
        timeString += `${minutes} minute${minutes === 1 ? '' : 's'} `
      }
      timeString += `${seconds} second${seconds === 1 ? '' : 's'}`
      
      // Update countdown display
      const countdownElement = document.getElementById('countdown')
      if (countdownElement) {
        countdownElement.textContent = `Submissions close in: ${timeString}`
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [submissionDeadline])

  useEffect(() => {
    if (!parsedVotingDeadline) return

    const timer = setInterval(() => {
      const now = new Date()
      const timeLeft = parsedVotingDeadline.getTime() - now.getTime()
      
      if (timeLeft <= 0) {
        clearInterval(timer)
        return
      }
      
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      
      let timeString = ''
      if (days > 0) {
        timeString += `${days} day${days === 1 ? '' : 's'} `
      }
      if (days > 0 || hours > 0) {
        timeString += `${hours} hour${hours === 1 ? '' : 's'} `
      }
      if (days > 0 || hours > 0 || minutes > 0) {
        timeString += `${minutes} minute${minutes === 1 ? '' : 's'} `
      }
      timeString += `${seconds} second${seconds === 1 ? '' : 's'}`
      
      // Update countdown display
      const countdownElement = document.getElementById('voting-countdown')
      if (countdownElement) {
        countdownElement.textContent = `Voting closes in: ${timeString}`
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [parsedVotingDeadline])

  // Vote cooldown timer
  useEffect(() => {
    if (voteCooldown <= 0) return

    const timer = setTimeout(() => {
      setVoteCooldown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [voteCooldown])

  // Auto-load voting pair when displayState changes to voting
  useEffect(() => {
    if (displayState === 'voting' && allSubmissions.length >= 2) {
      loadNewPair(votedPairs)
    }
  }, [displayState, allSubmissions])

  // Fade out ELO toast after 2 seconds
  useEffect(() => {
    if (eloChange !== null) {
      const timer = setTimeout(() => {
        setEloChange(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [eloChange])

  // Sync localUserSubmission with prop changes
  useEffect(() => {
    setLocalUserSubmission(userSubmission)
  }, [userSubmission])

  // Handle voting state change while editing
  useEffect(() => {
    if (isEditing && displayState === 'voting') {
      setIsEditing(false)
      setEditContent('')
      setEditValidationError('')
    }
  }, [displayState, isEditing])

  const handleSubmitSubmission = async () => {
    if (!submissionContent.trim()) {
      setValidationError('Please write something before submitting.')
      return
    }

    // Check for banned words
    if (containsBannedWord(submissionContent)) {
      setValidationError('Inappropriate content. Please rewrite.')
      return
    }

    setValidationError('')

    try {
      // Get session token properly
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setValidationError('Authentication required. Please log in.')
        return
      }

      // Log moderation check and validate
      const moderationResult = await validateAndLogContent(currentUserId, submissionContent.trim(), 'weekly_duel')
      if (!moderationResult.isValid) {
        setValidationError(moderationResult.error || 'Inappropriate content. Please rewrite.')
        return
      }


      const response = await fetch('/compete/weekly-duel/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: submissionContent,
          duel_id: currentDuel?.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setSubmissionContent('')
        setValidationError('')
        
        // Show ELO popup if ELO was gained
        if (result.eloGained) {
          setEloPopupMessage(`+${result.eloGained} ELO`)
          setShowEloPopup(true)
        }
        
        // Update local state immediately
        const newSubmission: UserSubmission = {
          id: result.submission.id,
          content: submissionContent,
          vote_score: 0,
          vote_count: 0,
          created_at: result.submission.created_at,
          user_id: currentUserId
        }
        setLocalUserSubmission(newSubmission)
        // Notify parent component to update allSubmissions
        if (onSubmissionSuccess) {
          onSubmissionSuccess(newSubmission)
        }
      } else {
        console.error('Submit failed:', result.error)
        setValidationError(result.error || 'Failed to submit. Please try again.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setValidationError('Network error. Please try again.')
    }
  }

  const handleUpdateSubmission = async () => {
    if (!editContent.trim()) {
      setEditValidationError('Please write something before updating.')
      return
    }

    // Check for banned words
    if (containsBannedWord(editContent)) {
      setEditValidationError('Inappropriate content. Please rewrite.')
      return
    }

    if (editContent.trim() === localUserSubmission?.content.trim()) {
      setIsEditing(false)
      setEditContent('')
      setEditValidationError('')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setEditValidationError('Authentication required. Please log in.')
        return
      }

      // Log moderation check and validate
      const moderationResult = await validateAndLogContent(currentUserId, editContent.trim(), 'weekly_duel')
      if (!moderationResult.isValid) {
        setEditValidationError(moderationResult.error || 'Inappropriate content. Please rewrite.')
        return
      }

      const response = await fetch('/compete/weekly-duel/api/submit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: editContent,
          duel_id: currentDuel?.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setEditContent('')
        setEditValidationError('')
        setIsEditing(false)
        // Update local state immediately
        const updatedSubmission: UserSubmission = {
          ...localUserSubmission!,
          content: editContent
        }
        setLocalUserSubmission(updatedSubmission)
        // Notify parent component to update allSubmissions
        if (onSubmissionSuccess) {
          onSubmissionSuccess(updatedSubmission)
        }
      } else {
        console.error('Update failed:', result.error)
        setEditValidationError(result.error || 'Failed to update. Please try again.')
      }
    } catch (error) {
      console.error('Update error:', error)
      setEditValidationError('Network error. Please try again.')
    }
  }

  const handleVote = async (winnerId: string, loserId: string) => {
    if (voteCooldown > 0) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return
      }

      const response = await fetch('/compete/weekly-duel/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          winner_submission_id: winnerId,
          loser_submission_id: loserId
        })
      })

      const result = await response.json()
      
      
      if (result.success) {
        setEloChange(result.elo_change || 1)
        
        // Mark this pair as voted
        const newVotedPairs = new Set(votedPairs)
        newVotedPairs.add(`${winnerId}|${loserId}`)
        newVotedPairs.add(`${loserId}|${winnerId}`)
        setVotedPairs(newVotedPairs)
        
        // Load new pair immediately with updated voted pairs
        const nextPair = loadNewPair(newVotedPairs)
        
        // Only start cooldown if there are more pairs available
        if (nextPair) {
          setVoteCooldown(30)
        }
      } else {
        console.error('Vote failed:', result.error)
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const loadNewPair = (currentVotedPairs: Set<string>): { a: string, b: string } | null => {
    // Get all possible pairs that user hasn't voted on
    const availablePairs: string[] = []
    
    for (let i = 0; i < allSubmissions.length; i++) {
      for (let j = i + 1; j < allSubmissions.length; j++) {
        // Skip pairs where either submission belongs to current user
        if (allSubmissions[i].user_id === currentUserId || allSubmissions[j].user_id === currentUserId) {
          continue
        }
        
        const pair1 = `${allSubmissions[i].id}|${allSubmissions[j].id}`
        const pair2 = `${allSubmissions[j].id}|${allSubmissions[i].id}`
        
        if (!currentVotedPairs.has(pair1) && !currentVotedPairs.has(pair2)) {
          availablePairs.push(pair1)
        }
      }
    }
    
    if (availablePairs.length === 0) {
      setCurrentPair(null)
      return null
    }
    
    // Select random pair
    const randomIndex = Math.floor(Math.random() * availablePairs.length)
    const selectedPair = availablePairs[randomIndex]
    const [sub1, sub2] = selectedPair.split('|')
    
    setCurrentPair({ a: sub1, b: sub2 })
    return { a: sub1, b: sub2 }
  }

  const formatEST = (dateStr: string) => {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'var(--gold)'
    if (rank === 2) return 'var(--silver)'
    if (rank === 3) return 'var(--bronze)'
    if (rank <= 5) return 'var(--purple)'
    if (rank <= 10) return 'var(--green)'
    return 'var(--grey)'
  }

  const getPodiumPosition = (rank: number) => {
    if (rank === 1) return 'center'
    if (rank === 2) return 'left'
    if (rank === 3) return 'right'
    return 'none'
  }

  const getPodiumSize = (rank: number) => {
    if (rank === 1) return '120px'
    if (rank === 2) return '100px'
    if (rank === 3) return '80px'
    return '0'
  }

  // Get top 3 past winners
  const top3Winners = pastWinners.slice(0, 3)

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '0 0 48px 0'
    }}>
      {/* Header - No card background like leaderboard */}
      <div style={{ 
        padding: '32px 24px 24px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
            Weekly Duel
          </h1>
        </div>
      </div>

      {/* Admin Preview Bar */}
      {isAdmin && (
        <div style={{ 
          background: 'var(--purple-tint)', 
          border: "1px solid var(--purple)", 
          borderRadius: '8px', 
          padding: '16px', 
          margin: '0 24px 24px 24px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
            <strong>Admin Preview:</strong>
            <select
              value={adminPreviewState}
              onChange={(e) => setAdminPreviewState(e.target.value as 'active' | 'voting' | 'results')}
              style={{ 
                margin: '0 8px', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: "1px solid var(--border)",
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)'
              }}
            >
              <option value="active">Active</option>
              <option value="voting">Voting</option>
              <option value="results">Results</option>
            </select>
            {adminPreviewState === 'active' && (
              <button
                onClick={() => setHasSubmittedPreview(!hasSubmittedPreview)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: "1px solid var(--border)",
                  background: hasSubmittedPreview ? 'var(--green-tint)' : 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                {hasSubmittedPreview ? 'Submitted' : 'Not Submitted'}
              </button>
            )}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text2)', 
            fontFamily: 'var(--font-body)', 
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            {adminPreviewState === 'active' && (
              hasSubmittedPreview 
                ? 'Admin has submitted an entry for this duel'
                : 'Admin has not submitted an entry yet for this duel'
            )}
            {adminPreviewState === 'voting' && 'Previewing voting phase'}
            {adminPreviewState === 'results' && 'Previewing results phase'}
          </div>
        </div>
      )}

      <div className="weekly-duel-container">
      
      {/* Left Side */}
      <div className="weekly-duel-main">
        
        {/* Active State - Submission Form or Confirmation */}
        {displayState === 'active' && currentDuel && (
          <div className="weekly-duel-card">
            {!displayUserSubmission ? (
              // Submission Form
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  Prompt: {currentDuel?.prompt || (
                    <span style={{
                      display: 'inline-block',
                      height: '24px',
                      background: 'var(--border)',
                      borderRadius: '4px',
                      width: '200px',
                      verticalAlign: 'middle'
                    }} />
                  )}
                </h2>
                <p style={{ fontSize: '16px', fontFamily: 'var(--font-body)', color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.5' }}>
                  Share your best response to this week's prompt. Be creative and original!
                </p>
                
                <textarea
                  value={submissionContent}
                  onChange={(e) => {
                    setSubmissionContent(e.target.value)
                    setValidationError('')
                    setModerationError(null)
                  }}
                  placeholder="Type your submission here..."
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: "1px solid var(--border)",
                    background: 'var(--surface)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text)',
                    resize: 'vertical',
                    marginBottom: validationError ? '8px' : '16px'
                  }}
                />
                
                {validationError && (
                  <div style={{ 
                    color: 'var(--red)', 
                    fontSize: '14px', 
                    fontFamily: 'var(--font-body)', 
                    marginBottom: '16px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {validationError}
                  </div>
                )}
                
                <button
                  onClick={handleSubmitSubmission}
                  disabled={!submissionContent.trim()}
                  className="btn-cta-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                >
                  Submit Entry
                </button>
              </div>
            ) : (
              // Active State - Already Submitted
              <div style={{ textAlign: 'center' }}>
                {isEditing ? (
                  // Edit Mode
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                      Edit Your Entry
                    </h2>
                    <p style={{ fontSize: '16px', fontFamily: 'var(--font-body)', color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.5' }}>
                      Update your submission before the voting period begins.
                    </p>
                    
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value)
                        setEditValidationError('')
                        setModerationError(null)
                      }}
                      placeholder="Type your updated submission here..."
                      style={{
                        width: '100%',
                        height: '200px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: "1px solid var(--border)",
                        background: 'var(--surface)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text)',
                        resize: 'vertical',
                        marginBottom: editValidationError ? '8px' : '16px'
                      }}
                    />
                    
                    {editValidationError && (
                      <div style={{ 
                        color: 'var(--red)', 
                        fontSize: '14px', 
                        fontFamily: 'var(--font-body)', 
                        marginBottom: '16px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {editValidationError}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleUpdateSubmission}
                        disabled={!editContent.trim()}
                        className="btn-cta-primary"
                        style={{ flex: 1, padding: '16px', fontSize: '16px' }}
                      >
                        Update Submission
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditContent('')
                          setEditValidationError('')
                        }}
                        className="btn-cta-ghost"
                        style={{ padding: '16px 24px', fontSize: '16px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Confirmation View
                  <div>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: 'var(--green-tint)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 24px auto'
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                      Entry Submitted!
                    </h2>
                    <p style={{ fontSize: '16px', fontFamily: 'var(--font-body)', color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.5' }}>
                      Your submission has been received. Voting will begin once the submission period ends.
                    </p>
                    <div style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'var(--surface)', 
                      border: "1px solid var(--border)",
                      textAlign: 'left',
                      marginBottom: '24px'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
                        Your submission:
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontFamily: 'var(--font-body)', 
                        color: 'var(--text)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.5'
                      }}>
                        {userSubmission?.content || displayUserSubmission.content}
                      </div>
                    </div>
                    {currentDuel?.status === 'active' && (
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setEditContent(userSubmission?.content || displayUserSubmission.content)
                          setEditValidationError('')
                        }}
                        className="btn-cta-ghost"
                        style={{ padding: '12px 24px', fontSize: '14px' }}
                      >
                        Edit Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Countdown Timer */}
            {submissionDeadline && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '8px', textAlign: 'center' }}>
                  Submissions close in:
                </div>
                <div id="countdown" style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--purple)', textAlign: 'center', padding: '12px', borderRadius: '8px', background: 'var(--purple-tint)', border: "1px solid var(--purple)" }}>
                  Loading countdown...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results State */}
        {displayState === 'results' && currentDuel && (
                <div>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => {
                      setSubmissionContent(e.target.value)
                      if (validationError) setValidationError('')
                    }}
                    placeholder="Enter your weekly submission..."
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: "1px solid var(--border)",
                      background: 'var(--surface)',
                      fontSize: '16px',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text)',
                      resize: 'vertical',
                      marginBottom: validationError ? '8px' : '16px'
                    }}
                  />
                  
                  {validationError && (
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--red)',
                      fontFamily: 'var(--font-body)',
                      marginBottom: '16px'
                    }}>
                      {validationError}
                    </div>
                  )}
                  
                  <button
                    onClick={handleSubmitSubmission}
                    className="btn-cta-primary"
                    style={{ width: '100%' }}
                  >
                    Submit Entry
                  </button>
                </div>
              )}


              {/* Voting State */}
              {displayState === 'voting' && (
                <div>
                  {/* Show message if user was editing when voting started */}
                  {isEditing && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'var(--yellow-tint)',
                      border: '1px solid var(--yellow)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--yellow)', marginBottom: '4px' }}>
                        Voting has started!
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                        Your original submission was kept and is now part of the voting pool.
                      </div>
                    </div>
                  )}
                  
                  {/* Voting countdown timer */}
                  {votingDeadline && (
                    <div style={{ marginBottom: '24px' }}>
                      <div id="voting-countdown" style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--purple)', textAlign: 'center', padding: '12px', borderRadius: '8px', background: 'var(--purple-tint)', border: "1px solid var(--purple)" }}>
                        Loading countdown...
                      </div>
                    </div>
                  )}
                  
                  {/* Always show matchup counter */}
                  <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '16px' }}>
                    Matchups reviewed: {Math.floor(votedPairs.size / 2)}
                  </div>
                  
                  {allSubmissions.length < 2 ? (
                    <div style={{ textAlign: 'center', fontSize: '18px', color: 'var(--text2)', fontFamily: 'var(--font-body)', padding: '32px' }}>
                      <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                        🗳
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                        Voting requires at least 2 submissions to generate matchups.
                      </div>
                    </div>
                  ) : voteCooldown > 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--purple)' }}>
                        Next matchup in {voteCooldown} seconds...
                      </div>
                    </div>
                  ) : currentPair ? (
                    <div>
                      <div className="weekly-duel-voting-header">
                        Vote for better submission
                      </div>
                      
                      <div className="weekly-duel-voting-grid">
                        <div className="weekly-duel-voting-option"
                          onClick={() => handleVote(currentPair.a, currentPair.b)}
                        >
                          <div className="weekly-duel-voting-option-content">
                            {allSubmissions.find(s => s.id === currentPair.a)?.content || 'Submission A'}
                          </div>
                          <button
                            style={{
                              padding: '8px 24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'var(--purple)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-display)',
                              cursor: 'pointer'
                            }}
                          >
                            Vote
                          </button>
                        </div>
                        
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '32px', 
                          borderRadius: '12px',
                          border: '2px solid var(--purple)',
                          background: 'var(--purple-tint)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                          onClick={() => handleVote(currentPair.b, currentPair.a)}
                        >
                          <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                            {allSubmissions.find(s => s.id === currentPair.b)?.content || 'Submission B'}
                          </div>
                          <button
                            style={{
                              padding: '8px 24px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'var(--purple)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-display)',
                              cursor: 'pointer'
                            }}
                          >
                            Vote
                          </button>
                        </div>
                      </div>

                      {voteCooldown > 0 && (
                        <div style={{ textAlign: 'center', fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginTop: '12px' }}>
                          Next pair in {voteCooldown} seconds...
                        </div>
                      )}

                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: '18px', color: 'var(--text2)', fontFamily: 'var(--font-body)', padding: '32px' }}>
                      <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)', marginBottom: '16px' }}>
                        ✓ Complete
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                        You've voted on all available matchups
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Results State */}
              {displayState === 'results' && (
                <div style={{ 
                  background: 'var(--card)', 
                  borderRadius: '16px', 
                  padding: '32px',
                  border: "1px solid var(--border)",
                  boxShadow: 'var(--shadow)',
                  textAlign: 'center'
                }}>
                  {currentDuel?.prize_distributed ? (
                    // Show winners once prizes are distributed
                    <>
                      <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '16px' }}>
                        🏆
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                        Results are in!
                      </div>
                      <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '24px' }}>
                        Winners have been announced and ELO prizes distributed.
                      </div>
                      {displayUserSubmission ? (
                        <div style={{ 
                          padding: '20px', 
                          borderRadius: '12px', 
                          background: 'var(--surface)', 
                          border: "1px solid var(--border)",
                          textAlign: 'left',
                          marginBottom: '24px'
                        }}>
                          <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
                            Your final result:
                          </div>
                          <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-display)', color: getRankColor(displayUserSubmission.final_rank || 0), marginBottom: '8px' }}>
                            #{displayUserSubmission.final_rank || '—'}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                            {displayUserSubmission.final_rank ? `Place #${displayUserSubmission.final_rank}` : 'Did not place'}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                            {displayUserSubmission.elo_awarded ? `+${displayUserSubmission.elo_awarded} ELO` : 'No ELO earned'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                          You did not participate in this duel.
                        </div>
                      )}
                    </>
                  ) : (
                    // Show loading message while prizes are being calculated
                    <>
                      <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                        ⏳
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                        Results are being calculated...
                      </div>
                      <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                        Winners will be announced soon!
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Between Duels State - Show for all users when no active duel */}
              {displayState === 'between' && (
                <div style={{ 
                  background: 'var(--card)', 
                  borderRadius: '16px', 
                  padding: '32px',
                  border: "1px solid var(--border)",
                  boxShadow: 'var(--shadow)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                    🔄
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                    Next duel starts Monday at 12:00 AM EST
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                    Check back soon for the next weekly duel!
                  </div>
                </div>
              )}

          {/* No Active Duel */}
          {!currentDuel && (
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                🔄
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                Next duel starts Monday at 12:00 AM EST
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                Check back soon for the next weekly duel!
              </div>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="weekly-duel-sidebar">
          
          {/* Dates and Submission Counter */}
          {currentDuel && (
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '24px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 16px 0' }}>
                Duel Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Starts</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {formatEST(currentDuel.start_date)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Ends</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {formatEST(currentDuel.end_date)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Voting Period</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {formatEST(currentDuel.end_date)} - {formatEST(new Date(new Date(currentDuel.end_date.endsWith('Z') ? currentDuel.end_date : currentDuel.end_date + 'Z').getTime() + 24 * 60 * 60 * 1000).toISOString())}
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                    (All times EST)
                  </div>
                </div>
              </div>

              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                borderRadius: '8px',
                background: 'var(--surface)',
                border: "1px solid var(--border)",
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  {allSubmissions.length === 1 ? '1 entrepreneur has entered' : `${allSubmissions.length} entrepreneurs have entered`}
                </div>
              </div>
            </div>
          )}

          {/* Prize Breakdown */}
          <div style={{ 
            background: 'var(--card)', 
            borderRadius: '16px', 
            padding: '24px',
            border: "1px solid var(--border)",
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 16px 0' }}>
              Prize Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🥇</span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>1st place +100 ELO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🥈</span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--silver)' }}>2nd place +90 ELO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🥉</span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--bronze)' }}>3rd place +80 ELO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--purple)' }}>4th-5th place +60 ELO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>6th-10th place +40 ELO</span>
              </div>
              <div style={{ 
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'var(--surface)',
                border: "1px solid var(--border)"
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Everyone who submits +10 ELO
                </span>
              </div>
              <div style={{ 
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--text2)',
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic'
              }}>
                Prizes are distributed after the voting period ends.
              </div>
            </div>
          </div>

          {/* Past Winners Podium */}
          <div style={{ 
            background: 'var(--card)', 
            borderRadius: '16px', 
            padding: '24px',
            border: "1px solid var(--border)",
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 16px 0' }}>
              Recent Winners
            </h3>
            
            {top3Winners.length > 0 ? (
              <div>
                {/* Podium */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', marginBottom: '20px', height: '140px' }}>
                  {/* 2nd Place */}
                  {top3Winners.find(w => w.rank === 2) && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      order: 2
                    }}>
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '8px',
                        background: 'var(--silver)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                        border: '2px solid var(--silver)'
                      }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>2</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', textAlign: 'center' }}>
                        <a
                          href={`/profile/${top3Winners.find(w => w.rank === 2)?.user_id.username}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--blue)',
                            fontSize: '12px'
                          }}
                        >
                          {top3Winners.find(w => w.rank === 2)?.user_id.username}
                        </a>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--silver)', fontWeight: 600 }}>
                        +{top3Winners.find(w => w.rank === 2)?.elo_awarded} ELO
                      </div>
                    </div>
                  )}
                  
                  {/* 1st Place */}
                  {top3Winners.find(w => w.rank === 1) && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      order: 1
                    }}>
                      <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '8px',
                        background: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                        border: '2px solid var(--gold)'
                      }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>1</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', textAlign: 'center' }}>
                        <a
                          href={`/profile/${top3Winners.find(w => w.rank === 1)?.user_id.username}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--blue)',
                            fontSize: '14px'
                          }}
                        >
                          {top3Winners.find(w => w.rank === 1)?.user_id.username}
                        </a>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 700 }}>
                        +{top3Winners.find(w => w.rank === 1)?.elo_awarded} ELO
                      </div>
                    </div>
                  )}
                  
                  {/* 3rd Place */}
                  {top3Winners.find(w => w.rank === 3) && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      order: 3
                    }}>
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '8px',
                        background: 'var(--bronze)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                        border: '2px solid var(--bronze)'
                      }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>3</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', textAlign: 'center' }}>
                        <a
                          href={`/profile/${top3Winners.find(w => w.rank === 3)?.user_id.username}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--blue)',
                            fontSize: '12px'
                          }}
                        >
                          {top3Winners.find(w => w.rank === 3)?.user_id.username}
                        </a>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--bronze)', fontWeight: 600 }}>
                        +{top3Winners.find(w => w.rank === 3)?.elo_awarded} ELO
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Prompt */}
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  border: "1px solid var(--border)",
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
                    Last week's prompt
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {pastWinners[0]?.id ? 'Previous duel prompt' : 'No past duels yet'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '32px', 
                borderRadius: '8px',
                background: 'var(--surface)',
                border: "1px solid var(--border)",
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  No past duels yet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ELO Popup */}
      <EloPopup message={eloPopupMessage} show={showEloPopup} />

      {/* ELO Change Toast (for voting) */}
      {eloChange !== null && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '32px',
          background: 'var(--green)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '16px',
          fontFamily: 'var(--font-display)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
        }}>
          +{eloChange} ELO
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
        </div>
      )}
    </div>
  )
}