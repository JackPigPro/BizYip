'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

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
  user?: { username: string; display_name?: string }
}

interface MatchVote {
  id: string
  match_id: string
  voter_id: string
  voted_for_id: string
  created_at: string
}

export default function ResultsPage() {
  const { isAuthenticated, authLoading, username, display_name } = useUser()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [submissions, setSubmissions] = useState<MatchSubmission[]>([])
  const [votes, setVotes] = useState<MatchVote[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState('')

  // Fetch match data and submissions
  useEffect(() => {
    if (!matchId || authLoading) {
      return undefined
    }

    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        // Fetch match with player details
        const matchResponse = await fetch(`/api/1v1/match/${matchId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (matchResponse.ok) {
          const matchResult = await matchResponse.json()
          setMatch(matchResult.data)
        }

        // Fetch submissions
        const submissionsResponse = await fetch(`/api/1v1/submissions/${matchId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (submissionsResponse.ok) {
          const submissionsResult = await submissionsResponse.json()
          setSubmissions(submissionsResult.data || [])
        }

        // Fetch votes
        const votesResponse = await fetch(`/api/1v1/votes/${matchId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (votesResponse.ok) {
          const votesResult = await votesResponse.json()
          setVotes(votesResult.data || [])
          
          // Check if current user has voted
          const userVote = votesResult.data?.find((v: MatchVote) => v.voter_id === username)
          setHasVoted(!!userVote)
        }
      } catch (err) {
        console.error('Fetch data error:', err)
        setError('Failed to load battle data')
      }
    }

    fetchData()
  }, [matchId, authLoading, username])

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
        
        // If match is complete, we could show winner info
        if (updatedMatch.status === 'complete') {
          // Winner determination logic could be added here
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, username])

  // Realtime subscription for votes
  useEffect(() => {
    if (!matchId || !username) {
      return undefined
    }

    const channel = supabase
      .channel(`votes-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_votes',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        const newVote = payload.new as MatchVote
        setVotes(prev => [...prev, newVote])
        
        // Check if this was the current user's vote
        if (newVote.voter_id === username) {
          setHasVoted(true)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, username])

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
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Loading results...</div>
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
            You need to be logged in to view battle results.
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

  const handleVote = async (submissionUserId: string) => {
    if (!match || !username || hasVoted) return

    // Cannot vote for yourself
    if (submissionUserId === username) return

    try {
      setIsVoting(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/1v1/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          match_id: matchId,
          voted_for_id: submissionUserId
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Vote successful:', result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to vote')
      }
    } catch (err) {
      console.error('Vote error:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  // Calculate vote counts for each submission
  const getVoteCount = (userId: string) => {
    return votes.filter(vote => vote.voted_for_id === userId).length
  }

  // Get submission for a user
  const getSubmission = (userId: string) => {
    return submissions.find(sub => sub.user_id === userId)
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
          <div style={{ fontSize: '18px', color: 'var(--text2)' }}>Loading results...</div>
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
            You need to be logged in to view battle results.
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

  const player1Submission = getSubmission(match.player1_id)
  const player2Submission = getSubmission(match.player2_id!)
  const player1Votes = getVoteCount(match.player1_id)
  const player2Votes = getVoteCount(match.player2_id!)

  const isParticipant = match.player1_id === username || match.player2_id === username

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
              {match.game_mode === 'logo' ? 'Logo Design' : 'Business Idea'} Battle Results
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              {match.is_private ? 'Private Room' : 'Ranked Match'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--purple)' }}>
              {votes.length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Votes
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link
              href="/1v1"
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
              New Battle
            </Link>
          </div>
        </div>

        {/* Prompt */}
        <div style={{ 
          marginBottom: '32px',
          padding: '20px',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Prompt
          </h2>
          <div style={{ 
            fontSize: '18px', 
            color: 'var(--text)', 
            fontFamily: 'var(--font-body)',
            lineHeight: '1.6'
          }}>
            {match.prompt}
          </div>
        </div>

        {/* Submissions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '32px' 
        }}>
          {/* Player 1 */}
          {player1Submission && (
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--green-tint)',
                color: 'var(--green)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {player1Votes} Votes
              </div>

              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                marginBottom: '16px',
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                paddingRight: '100px'
              }}>
                {player1Submission.user?.display_name || player1Submission.user?.username || 'Player 1'}
              </h3>

              {match.game_mode === 'logo' ? (
                <div style={{ marginBottom: '24px' }}>
                  {player1Submission.image_url && (
                    <img 
                      src={player1Submission.image_url} 
                      alt="Logo submission" 
                      style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }} 
                    />
                  )}
                </div>
              ) : (
                <div style={{ 
                  marginBottom: '24px',
                  padding: '20px',
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.6',
                  color: 'var(--text)'
                }}>
                  {player1Submission.content}
                </div>
              )}

              {!hasVoted && !isParticipant && match.player1_id !== username && (
                <button
                  onClick={() => handleVote(match.player1_id)}
                  disabled={isVoting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: isVoting ? 'var(--border)' : 'var(--green)',
                    color: isVoting ? 'var(--text2)' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: isVoting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isVoting ? 'Voting...' : 'Vote for this'}
                </button>
              )}
            </div>
          )}

          {/* Player 2 */}
          {player2Submission && (
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--blue-tint)',
                color: 'var(--blue)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {player2Votes} Votes
              </div>

              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                marginBottom: '16px',
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                paddingRight: '100px'
              }}>
                {player2Submission.user?.display_name || player2Submission.user?.username || 'Player 2'}
              </h3>

              {match.game_mode === 'logo' ? (
                <div style={{ marginBottom: '24px' }}>
                  {player2Submission.image_url && (
                    <img 
                      src={player2Submission.image_url} 
                      alt="Logo submission" 
                      style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }} 
                    />
                  )}
                </div>
              ) : (
                <div style={{ 
                  marginBottom: '24px',
                  padding: '20px',
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.6',
                  color: 'var(--text)'
                }}>
                  {player2Submission.content}
                </div>
              )}

              {!hasVoted && !isParticipant && match.player2_id !== username && (
                <button
                  onClick={() => handleVote(match.player2_id!)}
                  disabled={isVoting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: isVoting ? 'var(--border)' : 'var(--blue)',
                    color: isVoting ? 'var(--text2)' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: isVoting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isVoting ? 'Voting...' : 'Vote for this'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Voting Status */}
        <div style={{ 
          marginTop: '32px',
          padding: '20px',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          {hasVoted ? (
            <div style={{ color: 'var(--green)', fontSize: '16px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              ✓ Your vote has been recorded!
            </div>
          ) : isParticipant ? (
            <div style={{ color: 'var(--text2)', fontSize: '16px', fontFamily: 'var(--font-body)' }}>
              Battle participants cannot vote in their own battles
            </div>
          ) : (
            <div style={{ color: 'var(--text2)', fontSize: '16px', fontFamily: 'var(--font-body)' }}>
              Cast your vote for the best submission!
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
      </div>
    </div>
  )
}
