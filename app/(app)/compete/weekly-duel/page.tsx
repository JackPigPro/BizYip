'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import WeeklyDuelClient from './WeeklyDuelClient'
import { useRouter } from 'next/navigation'

type Winner = {
  id: string;
  prompt: string;
  rank: number;
  elo_awarded: number;
  user_id: {
    username: string;
  };
  created_at: string;
  username: string;
}

export default function WeeklyDuelPage() {
  const [user, setUser] = useState<any>(null)
  const [currentDuel, setCurrentDuel] = useState<any>(null)
  const [userSubmission, setUserSubmission] = useState<any>(null)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [pastWinners, setPastWinners] = useState<Winner[]>([])
  const [currentState, setCurrentState] = useState<'active' | 'voting' | 'results' | 'between'>('between')
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | null>(null)
  const [votingDeadline, setVotingDeadline] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Remove blocking loading state - render page shell immediately
  // const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      setUser(authUser)

      // Fetch current duel (active, voting, or completed)
      let currentDuel = null

      // Find most recent duel where status is in ['active', 'voting', 'completed']
      const { data: currentDuelData, error: currentDuelError } = await supabase
        .from('weekly_duel')
        .select('*')
        .in('status', ['active', 'voting', 'completed'])
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      if (currentDuelData && !currentDuelError) {
        currentDuel = currentDuelData
      }

      setCurrentDuel(currentDuel)

      // Fetch user's submission for current duel
      if (currentDuel && authUser) {
        const { data: userSub } = await supabase
          .from('duel_submissions')
          .select('*')
          .eq('duel_id', currentDuel.id)
          .eq('user_id', authUser.id)
          .maybeSingle()

        console.log('Setting userSubmission to:', userSub)
        setUserSubmission(userSub)

        // Fetch all submissions for current duel (public data)
        const { data: allSubs } = await supabase
          .from('duel_submissions')
          .select('id, content, vote_score, vote_count, created_at, user_id')
          .eq('duel_id', currentDuel.id)
          .order('vote_score', { ascending: false })

        setAllSubmissions(allSubs || [])
      }

      // Fetch past winners with separate queries
      // 1. Fetch completed duels
      const { data: completedDuels } = await supabase
        .from('weekly_duel')
        .select('*')
        .eq('status', 'completed')
        .eq('prize_distributed', true)
        .order('start_date', { ascending: false })
        .limit(10)

      if (completedDuels && completedDuels.length > 0) {
        const duelIds = completedDuels.map(d => d.id)

        // 2. Fetch top 3 winners for these duels - no profile join
        const { data: winners } = await supabase
          .from('duel_winners')
          .select('user_id, duel_id, rank, elo_awarded')
          .in('duel_id', duelIds)
          .lte('rank', 3)
          .order('rank', { ascending: true })

        if (winners && winners.length > 0) {
          // 3. Fetch profiles separately
          const userIds = [...new Set(winners.map(w => w.user_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .in('id', userIds)

          // 4. Merge in JavaScript
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
          const transformedWinners = winners.map(w => {
            const duel = completedDuels.find(d => d.id === w.duel_id)
            const profile = profileMap.get(w.user_id)
            return {
              id: w.user_id,
              username: profile?.username || 'Unknown',
              rank: w.rank,
              elo_awarded: w.elo_awarded,
              duel_id: w.duel_id,
              display_name: profile?.display_name || 'Unknown',
              prompt: duel?.prompt || '',
              user_id: {
                username: profile?.username || 'Unknown'
              },
              created_at: duel?.start_date || ''
            }
          })
          setPastWinners(transformedWinners)
        }
      }

      // Determine current state based on duel status from Supabase
      let state: 'active' | 'voting' | 'results' | 'between'
      let subDeadline: Date | null = null
      let voteDeadline: Date | null = null
      
      if (currentDuel) {
        // Use status column as source of truth - matches new cron schedule
        if (currentDuel.status === 'active') {
          // Active: Monday 12AM to Saturday 11:59PM EST
          state = 'active'
          subDeadline = new Date(currentDuel.end_date) // Saturday 11:59 PM EST
        } else if (currentDuel.status === 'voting') {
          // Voting: Sunday 12AM to Sunday 11:59PM EST  
          state = 'voting'
          // Voting ends 24 hours after end_date (which is Saturday 11:59 PM EST)
          voteDeadline = new Date(new Date(currentDuel.end_date + 'Z').getTime() + 24 * 60 * 60 * 1000)
        } else if (currentDuel.status === 'completed') {
          // Completed/Transitioning: Between Sunday 11:59PM and Monday 12AM
          state = 'results'
        } else if (currentDuel.status === 'queued') {
          // Queued/No active duel: Future duel not yet started
          state = 'between'
        } else {
          // Fallback to 'between' for any other status
          state = 'between'
        }
      } else {
        state = 'between'
      }

      setCurrentState(state)
      setSubmissionDeadline(subDeadline)
      setVotingDeadline(voteDeadline)
      

      setIsLoading(false)

    } catch (error) {
      console.error('Error fetching data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    const subscription = supabase
      .channel('weekly_duel_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_duel'
        },
        (payload) => {
          setRefreshTrigger(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // Poll as fallback every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Remove blocking loading check - render page shell immediately
  // if (loading) {
  //   return (
  //     <div style={{ 
  //       display: 'flex', 
  //       justifyContent: 'center', 
  //       alignItems: 'center', 
  //       height: '100vh',
  //       fontSize: '18px',
  //       color: 'var(--text)',
  //       fontFamily: 'var(--font-body)'
  //     }}>
  //       Loading...
  //     </div>
  //   )
  // }

  if (isLoading) {
    return (
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
            <div style={{ 
              width: '200px', 
              height: '48px', 
              background: 'var(--surface)', 
              borderRadius: '8px',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Left Side Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Main Card Skeleton */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)'
            }}>
              {/* Prompt Skeleton */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  width: '150px', 
                  height: '24px', 
                  background: 'var(--surface)', 
                  borderRadius: '6px',
                  marginBottom: '16px',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                <div style={{ 
                  width: '100%', 
                  height: '16px', 
                  background: 'var(--surface)', 
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                <div style={{ 
                  width: '80%', 
                  height: '16px', 
                  background: 'var(--surface)', 
                  borderRadius: '4px',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              </div>

              {/* Textarea Skeleton */}
              <div style={{ 
                width: '100%', 
                height: '200px', 
                background: 'var(--surface)', 
                borderRadius: '12px',
                marginBottom: '16px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />

              {/* Button Skeleton */}
              <div style={{ 
                width: '100%', 
                height: '52px', 
                background: 'var(--surface)', 
                borderRadius: '8px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>

            {/* Countdown Skeleton */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '24px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '120px', 
                height: '14px', 
                background: 'var(--surface)', 
                borderRadius: '4px',
                margin: '0 auto 8px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <div style={{ 
                width: '200px', 
                height: '20px', 
                background: 'var(--surface)', 
                borderRadius: '6px',
                margin: '0 auto',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>
          </div>

          {/* Right Side Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Duel Details Skeleton */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '24px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ 
                width: '120px', 
                height: '18px', 
                background: 'var(--surface)', 
                borderRadius: '6px',
                marginBottom: '16px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div style={{ 
                      width: '40px', 
                      height: '12px', 
                      background: 'var(--surface)', 
                      borderRadius: '4px',
                      marginBottom: '4px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                    <div style={{ 
                      width: '140px', 
                      height: '16px', 
                      background: 'var(--surface)', 
                      borderRadius: '4px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Breakdown Skeleton */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '24px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ 
                width: '140px', 
                height: '18px', 
                background: 'var(--surface)', 
                borderRadius: '6px',
                marginBottom: '16px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '16px', 
                      background: 'var(--surface)', 
                      borderRadius: '4px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                    <div style={{ 
                      width: '120px', 
                      height: '16px', 
                      background: 'var(--surface)', 
                      borderRadius: '4px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Winners Skeleton */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '24px',
              border: "1px solid var(--border)",
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ 
                width: '130px', 
                height: '18px', 
                background: 'var(--surface)', 
                borderRadius: '6px',
                marginBottom: '16px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              
              <div style={{ 
                height: '140px', 
                background: 'var(--surface)', 
                borderRadius: '8px',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    )
  }

  // Provide skeleton data for immediate rendering
  const skeletonDuel = {
    id: 'skeleton',
    prompt: 'Loading prompt...',
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    status: 'active' as const,
    prize_distributed: false
  }
  
  const skeletonSubmission = {
    id: 'skeleton',
    content: '',
    vote_score: 0,
    vote_count: 0,
    created_at: new Date().toISOString(),
    user_id: user?.id || '',
    final_rank: undefined,
    elo_awarded: undefined
  }

  const handleSubmissionSuccess = (newSubmission: any) => {
    // Add the new submission to allSubmissions to update counter immediately
    setAllSubmissions(prev => [...prev, newSubmission])
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
                Weekly Duel
              </h1>
            </div>
          </div>

          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            {/* Main Content */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
                  Sign in to join the Weekly Duel
                </div>
                <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
                  Compete against other entrepreneurs and win ELO prizes in our weekly competition.
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'var(--green)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  textDecoration: 'none'
                }}>
                  <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>
                    Sign In
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <WeeklyDuelClient 
      currentDuel={currentDuel || skeletonDuel}
      userSubmission={userSubmission}
      allSubmissions={allSubmissions || []}
      pastWinners={pastWinners || []}
      currentState={currentState || 'between'}
      submissionDeadline={submissionDeadline}
      votingDeadline={votingDeadline}
      parsedVotingDeadline={votingDeadline}
      currentUserId={user?.id || ''}
      onRefresh={() => setRefreshTrigger(prev => prev + 1)}
      onSubmissionSuccess={handleSubmissionSuccess}
    />
  )
}

