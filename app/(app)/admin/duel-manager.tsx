'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Duel {
  id: string
  prompt: string
  start_date: string
  end_date: string
  status: 'queued' | 'active' | 'voting' | 'completed'
  prize_distributed: boolean
  submission_count: number
}

interface DuelSubmission {
  id: string
  duel_id: string
  user_id: string
  content: string
  vote_score: number
  vote_count: number
  final_rank: number | null
  elo_awarded: number | null
  created_at: string
  username: string
}

interface CalendarWeek {
  weekNumber: number
  monday: Date
  sunday: Date
  duel: Duel | null
  isCurrentWeek: boolean
  isPastWeek: boolean
}

export default function AdminDuelManager() {
  const supabase = createClient()
  const [duels, setDuels] = useState<Duel[]>([])
  const [selectedWeek, setSelectedWeek] = useState<CalendarWeek | null>(null)
  const [duelSubmissions, setDuelSubmissions] = useState<DuelSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [editingPrompt, setEditingPrompt] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  
  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const fetchDuels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/get-duels', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setDuels(result.duels || [])
        return result.duels || []
      } else {
        setError(result.error || 'Failed to fetch duels')
        return []
      }
    } catch (error) {
      setError('Error fetching duels')
      return []
    }
  }

  const fetchDuelSubmissions = async (duelId: string) => {
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from('duel_submissions')
        .select('id, user_id, content, vote_score, vote_count, final_rank, elo_awarded, created_at')
        .eq('duel_id', duelId)
        .order('vote_score', { ascending: false })

      if (submissionsError) {
        return
      }

      // Fetch usernames
      const userIds = (submissions || []).map(sub => sub.user_id)
      let profilesMap: { [key: string]: string } = {}
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds)
        
        if (profilesError) {
        } else {
          profilesMap = (profiles || []).reduce((acc, profile) => {
            acc[profile.id] = profile.username || 'Unknown'
            return acc
          }, {} as { [key: string]: string })
        }
      }

      const transformedSubmissions: DuelSubmission[] = (submissions || []).map(sub => ({
        id: sub.id,
        duel_id: duelId,
        user_id: sub.user_id,
        content: sub.content,
        vote_score: sub.vote_score,
        vote_count: sub.vote_count,
        final_rank: sub.final_rank,
        elo_awarded: sub.elo_awarded,
        created_at: sub.created_at,
        username: profilesMap[sub.user_id] || 'Unknown'
      }))

      setDuelSubmissions(transformedSubmissions)
    } catch (error) {
    }
  }

  // Get the UTC offset for America/New_York at the given date
  const getESTOffset = (date: Date) => {
    const nyDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    return Math.round((date.getTime() - nyDate.getTime()) / (60 * 60 * 1000))
  }

  const createOrUpdateDuel = async () => {
    if (!editingPrompt.trim() || !selectedWeek) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (isCreatingNew || !selectedWeek.duel) {
        // Create new duel
        const response = await fetch('/admin/api/create-duel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            prompt_text: editingPrompt.trim(),
            start_date: (() => {
              const monday = new Date(Date.UTC(
                selectedWeek.monday.getFullYear(),
                selectedWeek.monday.getMonth(),
                selectedWeek.monday.getDate(),
                4, 0, 0, 0  // midnight EDT = 04:00 UTC
              ))
              return monday.toISOString().replace('T', ' ').slice(0, 19)
            })(),
            end_date: (() => {
              const saturday = new Date(Date.UTC(
                selectedWeek.monday.getFullYear(),
                selectedWeek.monday.getMonth(),
                selectedWeek.monday.getDate() + 6, // +6 days from Monday = Sunday in UTC, which is Saturday 11:59 PM EDT
                3, 59, 0, 0  // 11:59 PM EDT = 03:59 UTC next day
              ))
              return saturday.toISOString().replace('T', ' ').slice(0, 19)
            })()
          })
        })

        const result = await response.json()

        if (result.success) {
          setSuccess('Weekly duel created successfully!')
          setEditingPrompt('')
          setIsCreatingNew(false)
          const updatedDuels = await fetchDuels()
          const newDuel = updatedDuels?.find((d: any) => d.id === result.duel_id)
          if (newDuel && selectedWeek) {
            setSelectedWeek(prev => prev ? { ...prev, duel: newDuel } : null)
          }
        } else {
          setError(result.error || 'Failed to create duel')
        }
      } else {
        // Update existing duel
        const response = await fetch('/api/admin/update-duel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            id: selectedWeek.duel.id,
            prompt: editingPrompt.trim()
          })
        })

        const result = await response.json()

        if (result.success) {
          try {
            setSuccess('Duel updated successfully!')
            setIsCreatingNew(false)
            // Update selected week duel
            if (selectedWeek && result.duel) {
              setSelectedWeek(prev => prev ? { ...prev, duel: result.duel } : null)
            }
          } catch (error) {
            setError('Duel updated but there was an error updating the display')
          }
        } else {
          setError(result.error || 'Failed to update duel')
        }
      }
    } catch (error) {
      setError('Error saving duel')
    } finally {
      setLoading(false)
    }
  }

  const deleteDuel = async (duelId: string) => {
    if (!confirm('Are you sure you want to delete this duel and all associated submissions? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/delete-duel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ duelId })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Duel deleted successfully!')
        setSelectedWeek(null)
        setDuelSubmissions([])
        fetchDuels()
      } else {
        setError(result.error || 'Failed to delete duel')
      }
    } catch (error) {
      setError('Error deleting duel')
    } finally {
      setLoading(false)
    }
  }

  const forceFinalize = async () => {
    if (!confirm('Are you sure you want to force finalize the current voting duel? This will distribute prizes immediately.')) {
      return
    }

    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/force-finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Prizes distributed successfully!')
        fetchDuels()
        if (selectedWeek?.duel) {
          fetchDuelSubmissions(selectedWeek.duel.id)
        }
      } else {
        setError(result.error || 'Failed to finalize duel')
      }
    } catch (error) {
      setError('Error finalizing duel')
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar weeks
  const generateCalendarWeeks = (): CalendarWeek[] => {
    const weeks: CalendarWeek[] = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // Find the first Monday of the month
    const firstDay = new Date(year, month, 1)
    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay() // 0=Sun, 1=Mon, 2=Tue...
    if (dayOfWeek === 0) {
      firstMonday.setDate(firstDay.getDate() + 1) // Sunday → next Monday
    } else if (dayOfWeek !== 1) {
      firstMonday.setDate(firstDay.getDate() + (8 - dayOfWeek)) // Any other day → next Monday
    }
    // If dayOfWeek === 1, already Monday, no change needed
    
    // Generate weeks for the month
    let currentWeekStart = new Date(firstMonday)
    
    for (let weekNum = 0; weekNum < 6; weekNum++) {
      const weekStart = new Date(currentWeekStart)
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekStart.getDate() + 5) // Monday + 5 = Saturday
      
      // Check if this week is in the current month
      if (weekStart.getMonth() !== month && weekEnd.getMonth() !== month) {
        break
      }
      
      // Find duel for this week
      const weekDuel = duels.find(duel => {
        const duelStart = new Date(duel.start_date)
        const duelEnd = new Date(duel.end_date)
        return duelStart <= weekEnd && duelEnd >= weekStart
      })
      
      const now = new Date()
      const isCurrentWeek = weekStart <= now && weekEnd >= now
      const isPastWeek = weekEnd < now
      
      weeks.push({
        weekNumber: weekNum + 1,
        monday: weekStart,
        sunday: weekEnd,
        duel: weekDuel || null,
        isCurrentWeek,
        isPastWeek
      })
      
      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }
    
    return weeks
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
    return date.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' EST'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981' // green
      case 'voting': return '#3b82f6' // blue
      case 'completed': return '#6b7280' // dark
      case 'queued': return '#9ca3af' // grey
      default: return '#9ca3af'
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'var(--gold)'
    if (rank === 2) return 'var(--silver)'
    if (rank === 3) return 'var(--bronze)'
    if (rank <= 5) return 'var(--purple)'
    if (rank <= 10) return 'var(--green)'
    return 'var(--grey)'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'voting': return 'Voting'
      case 'completed': return 'Completed'
      case 'queued': return 'Queued'
      default: return status
    }
  }

  // Handle week selection
  const handleWeekSelect = (week: CalendarWeek) => {
    setSelectedWeek(week)
    setEditingPrompt('')
    setIsCreatingNew(false)
    
    if (week.duel) {
      setEditingPrompt(week.duel.prompt)
      fetchDuelSubmissions(week.duel.id)
    } else {
      setDuelSubmissions([])
    }
  }

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  useEffect(() => {
    fetchDuels()
  }, [])

  const calendarWeeks = generateCalendarWeeks()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', minHeight: '100vh' }}>
      
      {/* Left Side - Calendar */}
      <div style={{ 
        background: 'var(--card)', 
        borderRadius: '16px', 
        padding: '32px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
            Duel Calendar
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigateMonth('prev')}
              className="btn-cta-ghost"
              style={{ padding: '8px 12px', fontSize: '14px' }}
            >
              ←
            </button>
            <span style={{ 
              padding: '8px 16px', 
              fontSize: '14px', 
              fontWeight: 600, 
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center'
            }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="btn-cta-ghost"
              style={{ padding: '8px 12px', fontSize: '14px' }}
            >
              →
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {calendarWeeks.map((week) => (
            <div
              key={`${week.monday.getTime()}-${week.sunday.getTime()}`}
              onClick={() => handleWeekSelect(week)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${
                  selectedWeek?.monday.getTime() === week.monday.getTime() 
                    ? 'var(--purple)' 
                    : week.isCurrentWeek 
                    ? 'var(--green)' 
                    : 'var(--border)'
                }`,
                background: week.isCurrentWeek ? 'var(--green-tint)' : 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '4px' }}>
                    Week {week.weekNumber}: {formatDate(week.monday)} - {formatDate(week.sunday)}
                  </div>
                  {week.duel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text2)', 
                        fontFamily: 'var(--font-body)',
                        flex: 1
                      }}>
                        {week.duel.prompt.substring(0, 50)}{week.duel.prompt.length > 50 ? '...' : ''}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: getStatusColor(week.duel.status)
                      }}>
                        {getStatusText(week.duel.status)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                      No prompt published
                    </div>
                  )}
                </div>
                {week.duel && (
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                    {week.duel.submission_count} submissions
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Week Detail Panel */}
      <div style={{ 
        background: 'var(--card)', 
        borderRadius: '16px', 
        padding: '32px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}>
        {selectedWeek ? (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 24px 0' }}>
              Week {selectedWeek.weekNumber} Details
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
                {formatDate(selectedWeek.monday)} - {formatDate(selectedWeek.sunday)}
              </div>
              {selectedWeek.isCurrentWeek && (
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--green)', 
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  Current Week
                </div>
              )}
            </div>

            {/* Prompt Editor */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                Weekly Prompt
              </h3>
              
              {!selectedWeek.duel || isCreatingNew ? (
                <div>
                  <textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    placeholder="Enter the weekly prompt..."
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: '16px',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text)',
                      resize: 'vertical',
                      marginBottom: '16px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={createOrUpdateDuel}
                      disabled={loading || !editingPrompt.trim()}
                      className="btn-cta-primary"
                      style={{ flex: 1 }}
                    >
                      {loading ? 'Publishing...' : 'Publish'}
                    </button>
                    {isCreatingNew && (
                      <button
                        onClick={() => {
                          setIsCreatingNew(false)
                          setEditingPrompt('')
                        }}
                        className="btn-cta-ghost"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {selectedWeek.duel.status === 'queued' ? (
                    <div style={{ marginBottom: '16px' }}>
                      <button
                        onClick={() => setIsCreatingNew(true)}
                        className="btn-cta-ghost"
                        style={{ fontSize: '14px' }}
                      >
                        Edit Prompt
                      </button>
                    </div>
                  ) : selectedWeek.duel.status === 'active' || selectedWeek.duel.status === 'voting' ? (
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--green)', 
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      Submissions open
                    </div>
                  ) : null}
                  
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    {selectedWeek.duel.prompt}
                  </div>
                </div>
              )}
            </div>

            {/* Duel Status */}
            {selectedWeek.duel && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  Duel Status
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Status</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: getStatusColor(selectedWeek.duel.status || 'queued'),
                      display: 'inline-block'
                    }}>
                      {getStatusText(selectedWeek.duel.status || 'queued')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Submissions</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                      {selectedWeek.duel.submission_count}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Starts</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                      {formatDateTime(selectedWeek.duel.start_date)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>Ends</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                      {formatDateTime(selectedWeek.duel.end_date)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submissions Table */}
            {selectedWeek.duel && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  Submissions
                </h3>
                {duelSubmissions.length > 0 ? (
                  <div style={{ 
                    background: 'var(--surface)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    border: '1px solid var(--border)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '120px 1fr 80px 80px 80px',
                      gap: '16px',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text2)',
                      background: 'var(--card)'
                    }}>
                      <div>Username</div>
                      <div>Full Submission Text</div>
                      <div style={{ textAlign: 'center' }}>Vote Score</div>
                      <div style={{ textAlign: 'center' }}>Vote Count</div>
                      <div style={{ textAlign: 'center' }}>Final Rank</div>
                    </div>
                    {duelSubmissions.map((submission, index) => (
                      <div key={submission.id} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '120px 1fr 80px 80px 80px',
                        gap: '16px',
                        padding: '12px 16px',
                        borderBottom: index < duelSubmissions.length - 1 ? '1px solid var(--border)' : 'none',
                        fontSize: '14px',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text)',
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontFamily: 'var(--font-display)',
                          color: 'var(--blue)'
                        }}>
                          {submission.username}
                        </div>
                        <div style={{ 
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {submission.content}
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          fontWeight: 700,
                          fontFamily: 'var(--font-display)',
                          color: 'var(--purple)'
                        }}>
                          {submission.vote_score}
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          fontSize: '12px',
                          color: 'var(--text2)'
                        }}>
                          {submission.vote_count}
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          fontWeight: 600,
                          fontFamily: 'var(--font-display)',
                          color: submission.final_rank ? getRankColor(submission.final_rank) : 'var(--text2)'
                        }}>
                          {submission.final_rank ? `#${submission.final_rank}` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '32px', 
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                      No submissions yet
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {selectedWeek.duel && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => deleteDuel(selectedWeek.duel!.id)}
                  disabled={loading}
                  className="btn-cta-danger"
                  style={{ fontSize: '14px' }}
                >
                  Delete Duel
                </button>
              </div>
            )}

            {/* Messages */}
            {success && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--green-tint)',
                border: '1px solid var(--green)',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'var(--font-display)',
                color: 'var(--green)'
              }}>
                {success}
              </div>
            )}
            
            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--red-tint)',
                border: '1px solid var(--red)',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'var(--font-display)',
                color: 'var(--red)'
              }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              Select a week from the calendar to view details
            </div>
          </div>
        )}

        {/* Emergency Force Finalize Button */}
        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={forceFinalize}
            disabled={loading}
            className="btn-cta-danger"
            style={{ 
              fontSize: '12px', 
              padding: '8px 16px',
              opacity: 0.7
            }}
          >
            Force Finalize Current Duel
          </button>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text2)', 
            fontFamily: 'var(--font-body)', 
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            Emergency use only - distributes prizes for current voting duel
          </div>
        </div>
      </div>
    </div>
  )
}
