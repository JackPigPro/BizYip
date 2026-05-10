'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import AdminDuelManager from './duel-manager'
import DailyBattleManager from './daily-battle-manager'

interface TeacherVerification {
  id: string
  user_id: string
  full_name: string
  school_name: string
  role: string
  verified: boolean
  created_at: string
  username?: string
}

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState<'weekly-duel' | 'daily-battle' | 'teachers'>('weekly-duel')
  const [teacherVerifications, setTeacherVerifications] = useState<TeacherVerification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeacherVerifications()
    }
  }, [activeTab])

  const fetchTeacherVerifications = async () => {
    try {
      setLoading(true)
      const { data: verifications, error } = await supabase
        .from('teacher_verifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch usernames for each verification
      const verificationsWithUsernames = await Promise.all(
        (verifications || []).map(async (verification) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', verification.user_id)
            .single()
          
          return {
            ...verification,
            username: profile?.username || 'Unknown'
          }
        })
      )

      setTeacherVerifications(verificationsWithUsernames)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTeacher = async (verificationId: string, userId: string) => {
    try {
      // Update teacher_verifications table
      const { error: verificationError } = await supabase
        .from('teacher_verifications')
        .update({ verified: true })
        .eq('id', verificationId)

      if (verificationError) throw verificationError

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ teacher_verified: true })
        .eq('id', userId)

      if (profileError) throw profileError

      // Refresh data
      await fetchTeacherVerifications()
    } catch (error) {
    }
  }

  const handleRevokeTeacher = async (verificationId: string, userId: string) => {
    try {
      // Update teacher_verifications table
      const { error: verificationError } = await supabase
        .from('teacher_verifications')
        .update({ verified: false })
        .eq('id', verificationId)

      if (verificationError) throw verificationError

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          teacher_verified: false,
          is_teacher: false 
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // Refresh data
      await fetchTeacherVerifications()
    } catch (error) {
    }
  }

  const handleDeclineTeacher = async (verificationId: string, userId: string) => {
    try {
      // Update profiles table to set is_teacher = false
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          teacher_verified: false,
          is_teacher: false 
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // Delete from teacher_verifications table
      const { error: deleteError } = await supabase
        .from('teacher_verifications')
        .delete()
        .eq('id', verificationId)

      if (deleteError) throw deleteError

      // Refresh data
      await fetchTeacherVerifications()
    } catch (error) {
    }
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="admin-tabs-container">
        <button
          onClick={() => setActiveTab('weekly-duel')}
          className="admin-tab-button"
          style={{
            background: activeTab === 'weekly-duel' ? 'var(--card)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Weekly Duel
        </button>
        <button
          onClick={() => setActiveTab('daily-battle')}
          className="admin-tab-button"
          style={{
            background: activeTab === 'daily-battle' ? 'var(--card)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Daily Battle
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className="admin-tab-button"
          style={{
            background: activeTab === 'teachers' ? 'var(--card)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Teachers
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'weekly-duel' && <AdminDuelManager />}
      {activeTab === 'daily-battle' && <DailyBattleManager />}
      {activeTab === 'teachers' && (
        <div style={{
          background: 'var(--card)',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid var(--border)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            fontFamily: 'var(--font-display)',
            color: 'var(--text)'
          }}>
            Teacher Verifications
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              Loading teacher verifications...
            </div>
          ) : teacherVerifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              No teacher verifications found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {teacherVerifications.map((verification) => (
                <div key={verification.id} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        @{verification.username}
                      </span>
                      <span style={{ 
                        marginLeft: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: verification.verified ? 'var(--green-tint)' : 'var(--orange-tint)',
                        color: verification.verified ? 'var(--green)' : 'var(--orange)'
                      }}>
                        {verification.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                      <strong>Name:</strong> {verification.full_name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                      <strong>School:</strong> {verification.school_name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                      <strong>Role:</strong> {verification.role}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                      Applied: {new Date(verification.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                    {!verification.verified ? (
                      <>
                        <button
                          onClick={() => handleVerifyTeacher(verification.id, verification.user_id)}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--green)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#22c55e'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--green)'
                          }}
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleDeclineTeacher(verification.id, verification.user_id)}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--red)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--red)'
                          }}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRevokeTeacher(verification.id, verification.user_id)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--red)'
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
