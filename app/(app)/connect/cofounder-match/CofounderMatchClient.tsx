'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/hooks/useUser'

interface Profile {
  id: string
  username: string
  status_tags?: string[]
  created_at: string
  bio?: string
  skills?: string[]
  cofounder_stage?: string
}

interface CofounderRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface CofounderMatchClientProps {
  profiles: Profile[]
  requests: CofounderRequest[]
  isListed: boolean
  connectedProfiles: Profile[]
  incomingRequestProfiles: Profile[]
  outgoingRequestProfiles: Profile[]
  currentUserId: string
}

export default function CofounderMatchClient({ 
  profiles, 
  requests, 
  isListed, 
  connectedProfiles,
  incomingRequestProfiles,
  outgoingRequestProfiles,
  currentUserId 
}: CofounderMatchClientProps) {
  const { isAuthenticated, authLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'discover' | 'mycofounders'>('discover')
  const supabase = createClient()

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '200px', 
            height: '48px', 
            background: 'var(--border)', 
            borderRadius: '8px', 
            margin: '0 auto 24px', 
            animation: 'pulse 2s infinite' 
          }} />
          <div style={{ 
            width: '300px', 
            height: '32px', 
            background: 'var(--border)', 
            borderRadius: '8px', 
            margin: '0 auto', 
            animation: 'pulse 2s infinite' 
          }} />
        </div>
      </div>
    )
  }

  // Show sign-in banner for non-authenticated users
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
            <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
              Co-founder Match
            </h1>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '400', 
              fontFamily: 'var(--font-body)', 
              color: 'var(--text2)'
            }}>
              Find your perfect co-founder match
            </div>
          </div>

          {/* Sign-in banner */}
          <div style={{ 
            background: 'var(--card)', 
            borderRadius: '16px', 
            padding: '48px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
              Sign in to appear as a co-founder
            </div>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '32px', lineHeight: '1.5' }}>
              Connect with other founders, build your team, and turn your startup vision into reality.
            </p>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                padding: '16px 32px',
                background: 'var(--green)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '18px',
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
              Sign In to Join
            </a>
          </div>

          {/* Public profiles preview */}
          <div style={{ 
            background: 'var(--card)', 
            borderRadius: '16px', 
            padding: '32px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-display)', 
              color: 'var(--text)', 
              marginBottom: '24px',
              letterSpacing: '-0.1px'
            }}>
              Available Founders ({profiles.length})
            </h2>
            
            {profiles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text2)',
                fontSize: '16px',
                fontFamily: 'var(--font-body)'
              }}>
                <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  🎯
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                  No founders available yet
                </div>
                <p style={{ fontSize: '16px', color: 'var(--text2)', marginTop: '16px' }}>
                  Sign in to be the first to appear in the co-founder matching pool!
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {profiles.map((profile) => (
                  <div key={profile.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '18px',
                      fontFamily: 'var(--font-display)',
                      flexShrink: 0
                    }}>
                      {profile.username.charAt(0)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.username}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text2)',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <a 
                          href={`/profile/${profile.username}`}
                          style={{
                            color: 'var(--text2)',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--text)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text2)'
                          }}
                        >
                          @{profile.username}
                        </a>
                      </div>
                      {profile.bio && (
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--text2)',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {profile.bio}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <a
                        href={`/profile/${profile.username}`}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          textDecoration: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-display)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          display: 'block'
                        }}
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleToggleListing = async () => {
    try {
      const response = await fetch('/connect/cofounder-match/api', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_to_cofounder: !isListed }),
      })

      if (!response.ok) {
        throw new Error('Failed to update listing status')
      }

      // Refresh page to show updated data
      window.location.reload()
    } catch (err) {
      console.error('Error toggling listing:', err)
      alert('Failed to update listing status. Please try again.')
    }
  }

  const handleSendRequest = async (receiverId: string) => {
    try {
      const response = await fetch('/connect/cofounder-match/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId }),
      })

      if (!response.ok) {
        throw new Error('Failed to send request')
      }

      const newRequest = await response.json()
      // Refresh page to show updated state
      window.location.reload()
    } catch (err) {
      console.error('Error sending request:', err)
      alert('Failed to send request. Please try again.')
    }
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/connect/cofounder-match/api', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} request`)
      }

      // Refresh page to show updated state
      window.location.reload()
    } catch (err) {
      console.error(`Error ${action}ing request:`, err)
      alert(`Failed to ${action} request. Please try again.`)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch('/connect/cofounder-match/api', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel request')
      }

      // Refresh page to show updated state
      window.location.reload()
    } catch (err) {
      console.error('Error canceling request:', err)
      alert('Failed to cancel request. Please try again.')
    }
  }

  const getProfileById = (id: string) => {
    return profiles.find(p => p.id === id) || 
           incomingRequestProfiles.find(p => p.id === id) ||
           outgoingRequestProfiles.find(p => p.id === id)
  }

  // Calculate the 4 sections
  // Note: profiles array is already filtered on server side to exclude users with pending/accepted requests
  // Current user will be included if they are listed as open_to_cofounder
  const discoverFounders = profiles

  const outgoingRequests = requests
    .filter(req => req.sender_id === currentUserId && req.status === 'pending')
    .map(req => ({ request: req, profile: getProfileById(req.receiver_id) }))
    .filter((item): item is { request: CofounderRequest; profile: Profile } => item.profile !== undefined)

  const incomingRequests = requests
    .filter(req => req.receiver_id === currentUserId && req.status === 'pending')
    .map(req => ({ request: req, profile: getProfileById(req.sender_id) }))
    .filter((item): item is { request: CofounderRequest; profile: Profile } => item.profile !== undefined)

  const myCofounders = connectedProfiles

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--red)', marginBottom: '16px' }}>
            Error
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>{error}</p>
        </div>
      </div>
    )
  }

  const ProfileCard = ({ profile, showConnectButton = true, showCancelButton = false, showAcceptDecline = false, request, isCurrentUser = false }: {
    profile: Profile
    showConnectButton?: boolean
    showCancelButton?: boolean
    showAcceptDecline?: boolean
    request?: CofounderRequest
    isCurrentUser?: boolean
  }) => (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: isCurrentUser ? 'var(--green)' : 'var(--blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: '18px',
        fontFamily: 'var(--font-display)',
        flexShrink: 0
      }}>
        {(profile.username).charAt(0)}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text)',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {profile.username}
          {isCurrentUser && (
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'white',
              background: 'var(--green)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontFamily: 'var(--font-display)'
            }}>
              You
            </span>
          )}
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--text2)',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <a 
            href={`/profile/${profile.username}`}
            style={{
              color: 'var(--text2)',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text2)'
            }}
          >
            @{profile.username}
          </a>
        </div>
        {profile.bio && (
          <div style={{
            fontSize: '13px',
            color: 'var(--text2)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {profile.bio}
          </div>
        )}
      </div>

      {!isCurrentUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {showConnectButton && !showAcceptDecline && (
            <button
              onClick={() => handleSendRequest(profile.id)}
              style={{
                padding: '8px 16px',
                background: 'var(--green)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Connect
            </button>
          )}
          
          {showCancelButton && request && (
            <button
              onClick={() => handleCancelRequest(request.id)}
              style={{
                padding: '8px 16px',
                background: 'var(--surface)',
                color: 'var(--text2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Cancel
            </button>
          )}

          {showAcceptDecline && request && (
            <>
              <button
                onClick={() => handleRequestAction(request.id, 'accept')}
                style={{
                  padding: '8px 16px',
                  background: 'var(--green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleRequestAction(request.id, 'reject')}
                style={{
                  padding: '8px 16px',
                  background: 'var(--surface)',
                  color: 'var(--text2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Decline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )

  const CofounderCard = ({ profile }: { profile: Profile }) => (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--green)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: '18px',
        fontFamily: 'var(--font-display)',
        flexShrink: 0
      }}>
        {(profile.username).charAt(0)}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text)',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {profile.username}
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--text2)',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          @{profile.username}
        </div>
        {profile.bio && (
          <div style={{
            fontSize: '13px',
            color: 'var(--text2)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {profile.bio}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a
          href={`/profile/${profile.username}`}
          style={{
            padding: '8px 16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            display: 'block'
          }}
        >
          View Profile
        </a>
      </div>
    </div>
  )

  const Section = ({ title, children, emptyMessage }: { title: string, children: React.ReactNode, emptyMessage: string }) => (
    <div style={{ 
      background: 'var(--card)', 
      borderRadius: '16px', 
      padding: '32px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
      marginBottom: '24px'
    }}>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: 700, 
        fontFamily: 'var(--font-display)', 
        color: 'var(--text)', 
        marginBottom: '24px',
        letterSpacing: '-0.1px'
      }}>
        {title}
      </h2>
      
      {children || (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text2)',
          fontSize: '16px',
          fontFamily: 'var(--font-body)'
        }}>
          <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
            🎯
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
            {emptyMessage}
          </div>
        </div>
      )}
    </div>
  )

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0 }}>
              Co-founder Match
            </h1>
            <button
              onClick={handleToggleListing}
              style={{
                padding: '12px 24px',
                background: isListed ? 'var(--surface)' : 'var(--green)',
                color: isListed ? 'var(--text)' : 'white',
                border: isListed ? '1px solid var(--border)' : '1px solid var(--green)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.2s ease'
              }}
            >
              {isListed ? 'Remove Myself from Pool' : 'List Myself as Cofounder'}
            </button>
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '400', 
            fontFamily: 'var(--font-body)', 
            color: 'var(--text2)'
          }}>
            Find your perfect co-founder match
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
          {/* Left Column - Tab Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: 'var(--shadow)'
            }}>
              <button
                onClick={() => setActiveTab('discover')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'discover' ? 'var(--green)' : 'transparent',
                  color: activeTab === 'discover' ? 'white' : 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '8px'
                }}
              >
                Discover Founders
              </button>
              <button
                onClick={() => setActiveTab('mycofounders')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'mycofounders' ? 'var(--green)' : 'transparent',
                  color: activeTab === 'mycofounders' ? 'white' : 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                My Cofounders
              </button>
            </div>

            {/* Stats */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                Your Stats
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Connected</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>{myCofounders.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Incoming Requests</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--blue)' }}>{incomingRequests.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Outgoing Requests</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--orange)' }}>{outgoingRequests.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeTab === 'discover' ? (
              <>
                {/* Discover Founders - Full Width Top Row */}
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
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--text)', 
                    marginBottom: '24px',
                    letterSpacing: '-0.1px'
                  }}>
                    Discover Founders
                  </h2>
                  
                  {discoverFounders.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: 'var(--text2)',
                      fontSize: '16px',
                      fontFamily: 'var(--font-body)'
                    }}>
                      <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                        �
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                        No founders to discover yet
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px'
                    }}>
                      {discoverFounders.map((profile) => (
                        <ProfileCard 
                          key={profile.id} 
                          profile={profile} 
                          showConnectButton={true} 
                          isCurrentUser={profile.id === currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row - Two Columns */}
                <div className="cofounder-match-bottom-row">
                  {/* Outgoing Requests - Left */}
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
                      fontFamily: 'var(--font-display)', 
                      color: 'var(--text)', 
                      marginBottom: '24px',
                      letterSpacing: '-0.1px'
                    }}>
                      Outgoing Requests
                    </h2>
                    
                    {outgoingRequests.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--text2)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)'
                      }}>
                        <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                          📤
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                          No outgoing requests
                        </div>
                      </div>
                    ) : (
                      <div className="cofounder-match-requests-grid">
                        {outgoingRequests.map(({ request, profile }) => (
                          <ProfileCard 
                            key={request.id} 
                            profile={profile} 
                            showConnectButton={false}
                            showCancelButton={true} 
                            request={request}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Incoming Requests - Right */}
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
                      fontFamily: 'var(--font-display)', 
                      color: 'var(--text)', 
                      marginBottom: '24px',
                      letterSpacing: '-0.1px'
                    }}>
                      Incoming Requests
                    </h2>
                    
                    {incomingRequests.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--text2)',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)'
                      }}>
                        <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                          📤
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                          No incoming requests
                        </div>
                      </div>
                    ) : (
                      <div className="cofounder-match-requests-grid">
                        {incomingRequests.map(({ request, profile }) => (
                          <ProfileCard 
                            key={request.id} 
                            profile={profile} 
                            showAcceptDecline={true} 
                            request={request}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* My Cofounders */
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
                  fontFamily: 'var(--font-display)', 
                  color: 'var(--text)', 
                  marginBottom: '24px',
                  letterSpacing: '-0.1px'
                }}>
                  My Cofounders
                </h2>
                
                {myCofounders.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text2)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-body)'
                  }}>
                    <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                      👋
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                      No cofounders yet
                    </div>
                  </div>
                ) : (
                  <div className="cofounder-match-profiles-grid">
                    {myCofounders.map((profile) => (
                      <CofounderCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
