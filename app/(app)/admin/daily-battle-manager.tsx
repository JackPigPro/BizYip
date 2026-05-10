'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface DailyBattle {
  id: string
  prompt: string
  date: string
  created_at: string
  submission_count: number
}

interface BattleFormData {
  date: string
  prompt: string
}

const getToday = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  // Returns YYYY-MM-DD format in EST/EDT
}

export default function DailyBattleManager() {
  const supabase = createClient()
  const [battles, setBattles] = useState<DailyBattle[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  // Get today's date string for min attribute
  const todayDateStr = getToday()

  const [formData, setFormData] = useState<BattleFormData>({
    date: todayDateStr,
    prompt: ''
  })

  useEffect(() => {
    // Set default date to today
    setFormData(prev => ({
      ...prev,
      date: getToday()
    }))
    
    fetchBattles()
  }, [])

  const fetchBattles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/daily-battles', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setBattles(result.battles || [])
      } else {
        setError(result.error || 'Failed to fetch daily battles')
      }
    } catch (error) {
      setError('Error fetching daily battles')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.date || !formData.prompt.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setSuccess('')
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/create-daily-battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          date: formData.date,
          prompt: formData.prompt.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Daily battle published successfully!')
        setFormData({
          date: getToday(),
          prompt: ''
        })
        fetchBattles()
      } else {
        setError(result.error || 'Failed to publish daily battle')
      }
    } catch (error) {
      setError('Error publishing daily battle')
    } finally {
      setLoading(false)
    }
  }

  const getNext7Days = () => {
    const days = []
    const today = getToday()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today + 'T00:00:00')
      date.setDate(date.getDate() + i)
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      const battle = battles.find(b => b.date === dateStr)
      
      days.push({
        date: dateStr,
        battle: battle,
        submissionCount: battle?.submission_count || 0
      })
    }
    
    return days
  }

  const getPastBattles = () => {
    const today = getToday()
    return battles
      .filter(b => b.date < today)
      .slice(0, 30) // Show last 30 past battles
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const upcomingDays = getNext7Days()
  const pastBattles = getPastBattles()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', minHeight: '100vh' }}>
      
      {/* Left Side - Form and Upcoming */}
      <div>
        {/* Publish Form */}
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: '16px', 
          padding: '32px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 24px 0' }}>
            Publish Daily Battle
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 600, 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: '8px'
              }}>
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                min={todayDateStr}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text)'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 600, 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: '8px'
              }}>
                Prompt
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Enter the daily prompt..."
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
                  resize: 'vertical'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !formData.date || !formData.prompt.trim()}
              className="btn-cta-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </form>

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

        {/* Next 7 Days */}
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: '16px', 
          padding: '32px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 24px 0' }}>
            Upcoming
          </h2>
          
          <div style={{ 
            background: 'var(--surface)', 
            borderRadius: '12px', 
            padding: '16px', 
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 1fr 120px',
              gap: '16px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              color: 'var(--text2)',
              background: 'var(--card)'
            }}>
              <div>Date</div>
              <div>Prompt</div>
              <div style={{ textAlign: 'center' }}>Submissions</div>
            </div>
            
            {upcomingDays.map((day, index) => (
              <div key={day.date} style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px 1fr 120px',
                gap: '16px',
                padding: '12px 16px',
                borderBottom: index < upcomingDays.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                color: 'var(--text)',
                alignItems: 'center'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontFamily: 'var(--font-display)'
                }}>
                  {formatDate(day.date)}
                </div>
                <div style={{ 
                  lineHeight: '1.4',
                  color: day.battle ? 'var(--text)' : 'var(--text2)'
                }}>
                  {day.battle ? day.battle.prompt : 'No prompt yet'}
                </div>
                <div style={{ 
                  textAlign: 'center',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--purple)'
                }}>
                  {day.submissionCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Past Battles */}
      <div style={{ 
        background: 'var(--card)', 
        borderRadius: '16px', 
        padding: '32px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 24px 0' }}>
          Past Daily Battles
        </h2>
        
        {pastBattles.length > 0 ? (
          <div style={{ 
            background: 'var(--surface)', 
            borderRadius: '12px', 
            padding: '16px', 
            border: '1px solid var(--border)',
            overflow: 'hidden',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px 1fr 120px',
              gap: '16px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              color: 'var(--text2)',
              background: 'var(--card)',
              position: 'sticky',
              top: 0
            }}>
              <div>Date</div>
              <div>Prompt</div>
              <div style={{ textAlign: 'center' }}>Submissions</div>
            </div>
            
            {pastBattles.map((battle, index) => (
              <div key={battle.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px 1fr 120px',
                gap: '16px',
                padding: '12px 16px',
                borderBottom: index < pastBattles.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                color: 'var(--text)',
                alignItems: 'center'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontFamily: 'var(--font-display)'
                }}>
                  {formatDate(battle.date)}
                </div>
                <div style={{ 
                  lineHeight: '1.4'
                }}>
                  {battle.prompt}
                </div>
                <div style={{ 
                  textAlign: 'center',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--purple)'
                }}>
                  {battle.submission_count}
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
              No past daily battles yet
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
