'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// No mock data - will show empty state for Recent Battles

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
}

// Game prompts
const LOGO_PROMPTS = [
  "Design a logo for a sustainable coffee delivery startup",
  "Create a logo for a virtual reality fitness app",
  "Design a logo for an eco-friendly pet food company",
  "Create a logo for a blockchain-based voting platform",
  "Design a logo for an AI-powered language learning app"
]

const BUSINESS_IDEA_PROMPTS = [
  "Pitch a business idea for solving urban food waste",
  "Create a concept for a mental health support platform",
  "Develop a business model for sustainable fashion rental",
  "Pitch an app for connecting elderly with tech mentors",
  "Create a business idea for renewable energy storage"
]

export default function OneVOnePage() {
  const { isAuthenticated, authLoading, elo, username, user, profile } = useUser()
  const router = useRouter()
  const supabase = createClient()

  // Fix for authLoading getting stuck - use a shorter timeout with proper fallback
  const [authTimeout, setAuthTimeout] = useState(false)
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        setAuthTimeout(true)
      }, 2000) // 2 second timeout
      return () => clearTimeout(timer)
    } else {
      setAuthTimeout(false)
    }
  }, [authLoading])
  const [selectedGameMode, setSelectedGameMode] = useState<'logo' | 'business_idea'>('logo')
  const [roomCode, setRoomCode] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRanked, setIsJoiningRanked] = useState(false)
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false)
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [generatedRoomCode, setGeneratedRoomCode] = useState('')
  const [error, setError] = useState('')

  // No stats to calculate since we have no battles yet
  const totalMatches = 0
  const wins = 0
  const winRate = 0

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Realtime subscription for match updates
  useEffect(() => {
    if (!currentMatch || !username) {
      return undefined
    }


    const channel = supabase
      .channel('matches_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        
        // Handle different event types
        if (payload.eventType === 'UPDATE') {
          const updatedMatch = payload.new as Match
          
          // Only process updates for our specific match
          if (updatedMatch.id === currentMatch.id) {
            setCurrentMatch(updatedMatch)
            
            // If match became active, redirect to game room
            
            if (updatedMatch.status === 'active' && updatedMatch.player2_id) {
              router.push(`/compete/live/${updatedMatch.id}`)
            } else if (updatedMatch.status === 'active') {
              router.push(`/compete/live/${updatedMatch.id}`)
            } else {
            }
          }
        } else if (payload.eventType === 'INSERT') {
          const newMatch = payload.new as Match
          
          // Only process inserts for our specific match
          if (newMatch.id === currentMatch.id) {
            setCurrentMatch(newMatch)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentMatch, username, router])

  if (authLoading && !authTimeout) {
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

  if (!isAuthenticated) {
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
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: 800, 
              letterSpacing: '-2px', 
              fontFamily: 'var(--font-display)', 
              color: 'var(--text)', 
              margin: 0,
              marginBottom: '8px'
            }}>
              Live 1v1
            </h1>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '400', 
              fontFamily: 'var(--font-body)', 
              color: 'var(--text2)' 
            }}>
              Face off against other entrepreneurs in intense head-to-head competitions
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Main Content - Queue Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Ranked Queue Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                    letterSpacing: '-0.1px',
                    margin: 0
                  }}>
                    Ranked Queue
                  </h2>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--green-tint)',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ELO on the line: ±25
                  </div>
                </div>
                
                {/* Game Mode Selector */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select Game Mode
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Logo Design Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'logo' ? '2px solid var(--green)' : '1px solid var(--border)',
                        background: selectedGameMode === 'logo' ? 'var(--green-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('logo')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🎨</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Logo Design
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a brand brief, upload your logo
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business Idea Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'business_idea' ? '2px solid var(--green)' : '1px solid var(--border)',
                        background: selectedGameMode === 'business_idea' ? 'var(--green-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('business_idea')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>💡</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Business Idea
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a market prompt, pitch your concept
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text2)' }}>Estimated wait:</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>~2:30</span>
                  </div>
                </div>
                
                {/* Sign-in banner instead of join queue button */}
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                    Sign in to compete
                  </div>
                  <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
                    Join ranked matches and climb the ELO leaderboard.
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
                      fontFamily: 'var(--font-display)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Sign In to Compete
                  </Link>
                </div>
              </div>

              {/* Private Room Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                    letterSpacing: '-0.1px',
                    margin: 0
                  }}>
                    Private Room
                  </h2>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--blue-tint)',
                    color: 'var(--blue)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Play with friends
                  </div>
                </div>
                
                {/* Sign-in banner for private room */}
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                    Sign in to create or join rooms
                  </div>
                  <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
                    Create private rooms to play with friends.
                  </p>
                  <Link
                    href="/login"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: 'var(--blue)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Sign In to Play
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side - Public Stats and Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Public Stats Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  marginBottom: '24px',
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)',
                  letterSpacing: '-0.1px'
                }}>
                  Active Matches
                </h2>
                
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    fontWeight: 800, 
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    0
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text2)',
                    fontFamily: 'var(--font-body)'
                  }}>
                    Currently active battles
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                    How to Watch
                  </h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)' }}>
                    <div style={{ marginBottom: '8px' }}>• Sign in to join live matches</div>
                    <div style={{ marginBottom: '8px' }}>• Watch ongoing battles in real-time</div>
                    <div>• Judge submissions to earn ELO</div>
                  </div>
                </div>
              </div>

              {/* Judge Banner */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                  Sign in to judge
                </div>
                <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
                  Help decide the winner and earn ELO rewards.
                </p>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'var(--orange)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 146, 60, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Sign In to Judge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateRoom = async () => {
    if (!selectedGameMode || !username) return
    
    try {
      setIsCreatingRoom(true)
      setError('')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Authentication required')
        return
      }
      
      const newCode = generateRoomCode()
      setGeneratedRoomCode(newCode)
      
      // Get random prompt
      const prompts = selectedGameMode === 'logo' ? LOGO_PROMPTS : BUSINESS_IDEA_PROMPTS
      const prompt = prompts[Math.floor(Math.random() * prompts.length)]
      
      const response = await fetch('/api/compete/live/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          game_mode: selectedGameMode,
          room_code: newCode,
          prompt,
          time_limit_seconds: selectedGameMode === 'logo' ? 300 : 60
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentMatch(result.data)
        setWaitingForOpponent(true)
      } else {
        setError(result.error || 'Failed to create room')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !selectedGameMode || !username) return
    
    try {
      setIsJoiningPrivate(true)
      setError('')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Authentication required')
        return
      }
      
      const response = await fetch('/api/compete/live/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          room_code: roomCode.trim(),
          game_mode: selectedGameMode
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentMatch(result.data)
        // Always show waiting popup - redirect will happen via realtime subscription
        setWaitingForOpponent(true)
      } else {
        setError(result.error || 'Failed to join room')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsJoiningPrivate(false)
    }
  }

  const handleJoinRankedQueue = async () => {
    if (!selectedGameMode || !username) return
    
    try {
      setIsJoiningRanked(true)
      setError('')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Authentication required')
        return
      }
      
      // Get random prompt
      const prompts = selectedGameMode === 'logo' ? LOGO_PROMPTS : BUSINESS_IDEA_PROMPTS
      const prompt = prompts[Math.floor(Math.random() * prompts.length)]
      
      const response = await fetch('/api/compete/live/join-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          game_mode: selectedGameMode,
          prompt,
          time_limit_seconds: selectedGameMode === 'logo' ? 300 : 60
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentMatch(result.data)
        // Always show waiting popup - redirect will happen via realtime subscription
        setWaitingForOpponent(true)
      } else {
        setError(result.error || 'Failed to join queue')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsJoiningRanked(false)
    }
  }

  const handleCancelQueue = async () => {
    if (!currentMatch || !username) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      
      await fetch('/api/compete/live/cancel-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          match_id: currentMatch.id
        })
      })
      
      setCurrentMatch(null)
      setWaitingForOpponent(false)
      setGeneratedRoomCode('')
    } catch (err) {
    }
  }

  return (
    <>
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: 800, 
              letterSpacing: '-2px', 
              fontFamily: 'var(--font-display)', 
              color: 'var(--text)', 
              margin: 0,
              marginBottom: '8px'
            }}>
              Live 1v1
            </h1>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '400', 
              fontFamily: 'var(--font-body)', 
              color: 'var(--text2)' 
            }}>
              Face off against other entrepreneurs in intense head-to-head competitions
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Main Content - Queue Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Ranked Queue Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                    letterSpacing: '-0.1px',
                    margin: 0
                  }}>
                    Ranked Queue
                  </h2>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--green-tint)',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ELO on the line: ±25
                  </div>
                </div>
                
                {/* Game Mode Selector */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select Game Mode
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Logo Design Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'logo' ? '2px solid var(--green)' : '1px solid var(--border)',
                        background: selectedGameMode === 'logo' ? 'var(--green-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('logo')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🎨</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Logo Design
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a brand brief, upload your logo
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business Idea Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'business_idea' ? '2px solid var(--green)' : '1px solid var(--border)',
                        background: selectedGameMode === 'business_idea' ? 'var(--green-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('business_idea')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>💡</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Business Idea
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a market prompt, pitch your concept
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text2)' }}>Estimated wait:</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>~2:30</span>
                  </div>
                </div>
                <button
                  onClick={handleJoinRankedQueue}
                  disabled={!selectedGameMode || isJoiningRanked}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: (selectedGameMode && !isJoiningRanked) ? 'var(--green)' : 'var(--border)',
                    color: (selectedGameMode && !isJoiningRanked) ? 'white' : 'var(--text2)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: (selectedGameMode && !isJoiningRanked) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: (selectedGameMode && !isJoiningRanked) ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGameMode && !isJoiningRanked) {
                      e.currentTarget.style.background = '#22c55e'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGameMode && !isJoiningRanked) {
                      e.currentTarget.style.background = 'var(--green)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {isJoiningRanked ? 'Joining...' : 'Join Ranked Queue'}
                </button>
              </div>

              {/* Private Room Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                    letterSpacing: '-0.1px',
                    margin: 0
                  }}>
                    Private Room
                  </h2>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'var(--blue-tint)',
                    color: 'var(--blue)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Play with friends
                  </div>
                </div>
                
                {/* Game Mode Selector */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select Game Mode
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Logo Design Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'logo' ? '2px solid var(--blue)' : '1px solid var(--border)',
                        background: selectedGameMode === 'logo' ? 'var(--blue-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('logo')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🎨</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Logo Design
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a brand brief, upload your logo
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business Idea Mode */}
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedGameMode === 'business_idea' ? '2px solid var(--blue)' : '1px solid var(--border)',
                        background: selectedGameMode === 'business_idea' ? 'var(--blue-tint)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedGameMode('business_idea')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>💡</div>
                        <div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            marginBottom: '4px',
                            fontFamily: 'var(--font-display)',
                            color: 'var(--text)',
                            letterSpacing: '-0.1px'
                          }}>
                            Business Idea
                          </div>
                          <div style={{ 
                            color: 'var(--text2)', 
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: '1.4'
                          }}>
                            Get a market prompt, pitch your concept
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!selectedGameMode || isCreatingRoom}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: (selectedGameMode && !isCreatingRoom) ? 'var(--blue)' : 'var(--border)',
                      color: (selectedGameMode && !isCreatingRoom) ? 'white' : 'var(--text2)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      cursor: (selectedGameMode && !isCreatingRoom) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      opacity: (selectedGameMode && !isCreatingRoom) ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => {
                      if (selectedGameMode && !isCreatingRoom) {
                        e.currentTarget.style.background = '#1d4ed8'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedGameMode && !isCreatingRoom) {
                        e.currentTarget.style.background = 'var(--blue)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {isCreatingRoom ? 'Creating...' : 'Create Room'}
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'var(--font-body)',
                        outline: 'none'
                      }}
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!roomCode.trim() || !selectedGameMode || isJoiningPrivate}
                      style={{
                        padding: '14px 20px',
                        background: (roomCode.trim() && selectedGameMode && !isJoiningPrivate) ? 'var(--text)' : 'var(--border)',
                        color: (roomCode.trim() && selectedGameMode && !isJoiningPrivate) ? 'white' : 'var(--text2)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        cursor: (roomCode.trim() && selectedGameMode && !isJoiningPrivate) ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        opacity: (roomCode.trim() && selectedGameMode && !isJoiningPrivate) ? 1 : 0.5
                      }}
                      onMouseEnter={(e) => {
                        if (roomCode.trim() && selectedGameMode && !isJoiningPrivate) {
                          e.currentTarget.style.background = '#0a0e1a'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (roomCode.trim() && selectedGameMode && !isJoiningPrivate) {
                          e.currentTarget.style.background = 'var(--text)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      {isJoiningPrivate ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Player Stats and Recent Battles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Player Stats Card */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
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
                
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    fontWeight: 800, 
                    color: 'var(--green)', 
                    fontFamily: 'var(--font-display)',
                    marginBottom: '8px',
                    letterSpacing: '-1px'
                  }}>
                    {elo?.elo || 1200}
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
                
                <div style={{ 
                  height: '1px', 
                  background: 'var(--border)', 
                  margin: '24px 0' 
                }} />
                
                <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Username:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{username}</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Matches:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{totalMatches}</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Win Rate:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{winRate}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>Ready to battle!</span>
                  </div>
                </div>
              </div>

              {/* Recent Battles Section */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  marginBottom: '24px',
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)',
                  letterSpacing: '-0.1px'
                }}>
                  Recent Battles
                </h2>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  color: 'var(--text2)',
                  fontFamily: 'var(--font-body)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
                  <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No battles yet</p>
                  <p style={{ fontSize: '13px' }}>Start competing to see your battle history here!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      
      {/* Waiting for Opponent Overlay */}
      {waitingForOpponent && currentMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--green-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse 2s infinite'
              }} />
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '16px',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)'
            }}>
              Waiting for opponent...
            </h2>
            
            <p style={{
              fontSize: '16px',
              color: 'var(--text2)',
              marginBottom: '24px',
              fontFamily: 'var(--font-body)',
              lineHeight: '1.5'
            }}>
              {currentMatch.is_private && generatedRoomCode ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>Share this code with your friend:</div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    color: 'var(--blue)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '4px',
                    marginBottom: '8px'
                  }}>
                    {generatedRoomCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRoomCode)
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--blue-tint)',
                      color: 'var(--blue)',
                      border: '1px solid var(--blue)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--blue)'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--blue-tint)'
                      e.currentTarget.style.color = 'var(--blue)'
                    }}
                  >
                    Copy Code
                  </button>
                </div>
              ) : (
                'Looking for a match in the ranked queue...'
              )}
            </p>
            
            <div style={{
              fontSize: '14px',
              color: 'var(--text2)',
              marginBottom: '24px',
              fontFamily: 'var(--font-body)'
            }}>
              Game Mode: <strong>{selectedGameMode === 'logo' ? 'Logo Design' : 'Business Idea'}</strong>
            </div>
            
            <button
              onClick={handleCancelQueue}
              style={{
                padding: '12px 24px',
                background: 'var(--border)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--text2)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}
