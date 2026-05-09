'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { containsBannedWord, validateAndLogContent } from '@/lib/moderation'

interface Match {
  id: string
  game_mode: 'logo' | 'business_idea'
  status: 'waiting' | 'active' | 'voting' | 'complete'
  player1_id: string
  player2_id: string | null
  prompt: string | null
  time_limit_seconds: number
  player1_submitted: boolean
  player2_submitted: boolean
  created_at: string
  started_at: string | null
  completed_at: string | null
  room_code: string | null
  is_private: boolean
  winner_id: string | null
  player1?: { username: string; display_name?: string }
  player2?: { username: string; display_name?: string }
}

interface MatchSubmission {
  id: string
  match_id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
}

export default function GameRoomPage() {
  const { isAuthenticated, authLoading, username, display_name } = useUser()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [submission, setSubmission] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [error, setError] = useState('')
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<{ username: string; display_name?: string } | null>(null)

  // Fetch match data
  useEffect(() => {
    if (!matchId || authLoading) {
      return undefined
    }

    const fetchMatch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/1v1/match/${matchId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setMatch(result.data)
          
          // Set up timer
          if (result.data.started_at) {
            const startTime = new Date(result.data.started_at).getTime()
            const timeLimit = result.data.time_limit_seconds * 1000
            const endTime = startTime + timeLimit
            
            const updateTimer = () => {
              const now = Date.now()
              const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
              setTimeLeft(remaining)
              
              if (remaining > 0) {
                requestAnimationFrame(updateTimer)
              }
            }
            updateTimer()
          }
        }
      } catch (err) {
        console.error('Fetch match error:', err)
        setError('Failed to load match')
      }
    }

    fetchMatch()
  }, [matchId, authLoading])

  // Realtime subscription for match updates
  useEffect(() => {
    if (!matchId || !username) {
      return undefined
    }

    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`
      }, (payload) => {
        const updatedMatch = payload.new as Match
        setMatch(updatedMatch)
        
        // Redirect to results when voting phase starts
        if (updatedMatch.status === 'voting') {
          router.push(`/1v1/${matchId}/results`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, username, router])

  if (authLoading) {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Loading battle...</div>
        </div>
      </div>
    )
  }

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
          <p style={{ color: 'var(--text2)', marginBottom: '24px', fontFamily: 'var(--font-body)' }}>
            You need to be logged in to join battles.
          </p>
          <Link
            href="/login?mode=login"
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

  if (!match) {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Battle not found</div>
        </div>
      </div>
    )
  }

  // Handle image upload for logo mode
  const handleImageUpload = async (file: File) => {
    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!match || !username) return

    const hasContent = match.game_mode === 'logo' ? imageFile : submission.trim()
    if (!hasContent) {
      setError('Please add content before submitting')
      return
    }

    // Check for banned words in text submissions
    if (match.game_mode === 'business_idea' && containsBannedWord(submission)) {
      setModerationError('Inappropriate content. Please rewrite.')
      return
    }

    setModerationError(null)

    try {
      setIsSubmitting(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      let submissionData: any = {
        match_id: matchId,
        user_id: username
      }

      if (match.game_mode === 'logo' && imageFile) {
        // Upload image first
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('matchId', matchId)

        const uploadResponse = await fetch('/api/1v1/upload-submission', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          submissionData.image_url = uploadResult.url
        } else {
          throw new Error('Failed to upload image')
        }
      } else if (match.game_mode === 'business_idea') {
        // Log moderation check and validate
        const moderationResult = await validateAndLogContent(username, submission.trim(), '1v1_answer')
        if (!moderationResult.isValid) {
          setModerationError(moderationResult.error || 'Inappropriate content. Please rewrite.')
          return
        }
        submissionData.content = submission.trim()
      }

      const response = await fetch('/api/1v1/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        // Submission successful, wait for opponent or redirect
        const result = await response.json()
        console.log('Submission successful:', result)
      } else {
        setError('Failed to submit')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Loading battle...</div>
        </div>
      </div>
    )
  }

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
          <p style={{ color: 'var(--text2)', marginBottom: '24px', fontFamily: 'var(--font-body)' }}>
            You need to be logged in to join battles.
          </p>
          <Link
            href="/login?mode=login"
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

  if (!match) {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Battle not found</div>
        </div>
      </div>
    )
  }

  const isPlayer1 = match.player1_id === username
  const hasSubmitted = isPlayer1 ? match.player1_submitted : match.player2_submitted

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '32px',
          padding: '20px',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {match.game_mode === 'logo' ? 'Logo Design' : 'Business Idea'} Battle
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              {match.is_private ? 'Private Room' : 'Ranked Match'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: timeLeft <= 10 ? 'var(--red)' : 'var(--green)' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Time Remaining
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
              Opponent
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              {opponent?.display_name || opponent?.username || 'Waiting...'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: '16px', 
          padding: '40px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)'
        }}>
          {/* Prompt */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Prompt
            </h2>
            <div style={{ 
              fontSize: '18px', 
              color: 'var(--text)', 
              fontFamily: 'var(--font-body)',
              lineHeight: '1.6',
              padding: '20px',
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              {match.prompt}
            </div>
          </div>

          {/* Submission Area */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Your Submission
            </h2>
            
            {match.game_mode === 'logo' ? (
              <div>
                {imageUrl ? (
                  <div style={{ marginBottom: '16px' }}>
                    <img 
                      src={imageUrl} 
                      alt="Logo preview" 
                      style={{ 
                        maxWidth: '300px', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }} 
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '300px',
                    height: '300px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    background: 'var(--surface)'
                  }}>
                    <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎨</div>
                      <div>Upload your logo</div>
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  disabled={hasSubmitted}
                  style={{ marginBottom: '16px' }}
                />
              </div>
            ) : (
              <textarea
                value={submission}
                onChange={(e) => {
                  setSubmission(e.target.value)
                  setError('')
                  setModerationError(null)
                }}
                placeholder="Type your business pitch here..."
                disabled={hasSubmitted}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: hasSubmitted ? 'var(--surface)' : 'var(--card)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text)',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={hasSubmitted || isSubmitting}
            style={{
              padding: '16px 32px',
              background: hasSubmitted ? 'var(--border)' : 'var(--green)',
              color: hasSubmitted ? 'var(--text2)' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              cursor: hasSubmitted ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: hasSubmitted ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!hasSubmitted) {
                e.currentTarget.style.background = '#22c55e'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!hasSubmitted) {
                e.currentTarget.style.background = 'var(--green)'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
          >
            {hasSubmitted ? 'Submitted' : (isSubmitting ? 'Submitting...' : 'Submit')}
          </button>

          {hasSubmitted && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px',
              background: 'var(--green-tint)',
              borderRadius: '8px',
              color: 'var(--green)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              textAlign: 'center'
            }}>
              Submission received! Waiting for your opponent...
            </div>
          )}
        </div>

          {/* Error Display */}
          {error && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'var(--red)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              zIndex: 1000,
              boxShadow: 'var(--shadow)'
            }}>
              {error}
            </div>
          )}
          {moderationError && (
            <div style={{
              position: 'fixed',
              top: '70px',
              right: '20px',
              background: 'var(--red)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              zIndex: 1000,
              boxShadow: 'var(--shadow)'
            }}>
              {moderationError}
            </div>
          )}
      </div>
    </div>
  )
}
