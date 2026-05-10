'use client'

import { FormEvent, useState, useEffect } from 'react'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { containsBannedWord, validateAndLogContent } from '@/lib/moderation'

const PRESET_AVATARS = [
  { id: 'avatar-1', color: '#6366F1' },
  { id: 'avatar-2', color: '#10B981' },
  { id: 'avatar-3', color: '#0EA5E9' },
  { id: 'avatar-4', color: '#F43F5E' },
  { id: 'avatar-5', color: '#F59E0B' },
  { id: 'avatar-6', color: '#8B5CF6' },
  { id: 'avatar-7', color: '#14B8A6' },
  { id: 'avatar-8', color: '#F97316' },
  { id: 'avatar-9', color: '#EC4899' },
  { id: 'avatar-10', color: '#3B82F6' }
]

const SKILLS_OPTIONS = [
  'Marketing',
  'Tech/Engineering', 
  'Finance',
  'Design',
  'Sales',
  'Operations',
  'Legal',
  'Content/Media',
  'Product',
  'Business Development'
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [username, setUsername] = useState('')
  const [displayUsername, setDisplayUsername] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].id)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Apply theme immediately when changed
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])
  const [skills, setSkills] = useState<string[]>([])
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moderationError, setModerationError] = useState<string | null>(null)

  // Check username availability in real-time
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null)
      setUsernameError(null)
      return
    }

    // Validate username rules
    const validationRules = [
      {
        test: username.length >= 3 && username.length <= 15,
        message: 'Username must be 3-15 characters'
      },
      {
        test: /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username),
        message: 'Username must start with a letter and contain only letters, numbers, and underscores'
      }
    ]

    const failedRule = validationRules.find(rule => !rule.test)
    if (failedRule) {
      setUsernameStatus('invalid')
      setUsernameError(failedRule.message)
      return
    }

    // Check for banned words
    if (containsBannedWord(username)) {
      setUsernameStatus('invalid')
      setUsernameError('Inappropriate content. Please rewrite.')
      setModerationError('Inappropriate content. Please rewrite.')
      return
    }

    setModerationError(null)

    setUsernameError(null)

    const checkUsername = async () => {
      setUsernameStatus('checking')
      
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(username.trim().toLowerCase())}`)
        const result = await response.json()

        if (!response.ok) {
          setUsernameStatus('invalid')
          setUsernameError(result.error || 'Failed to check username availability')
          return
        }

        setUsernameStatus(result.available ? 'available' : 'taken')
      } catch (err) {
        setUsernameStatus('invalid')
        setUsernameError('Failed to check username availability')
      }
    }

    const timeoutId = setTimeout(checkUsername, 300)
    return () => clearTimeout(timeoutId)
  }, [username])

  const isStep1Valid = usernameStatus === 'available' && ageConfirmed && agreedToTerms
  const isStep3Valid = true // Skills are optional, always valid

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setSkills(prev => {
      const newSkills = prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
      return newSkills
    })
  }

  const handleSubmit = async () => {
    if (!isStep1Valid) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Final moderation check before saving
      const moderationResult = await validateAndLogContent(user.id, username, 'username')
      if (!moderationResult.isValid) {
        setError(moderationResult.error || 'Inappropriate content. Please rewrite.')
        setLoading(false)
        return
      }

      // Get current profile to preserve email and auth_method
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email, auth_method')
        .eq('id', user.id)
        .single()

      // Save all onboarding data
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim(), // Preserve original case
          avatar: avatar,
          theme_preference: theme,
          skills: skills,
          agreed_to_terms: agreedToTerms,
          onboarding_complete: true,
          // Preserve existing email and auth_method
          email: currentProfile?.email || user.email?.toLowerCase() || '',
          auth_method: currentProfile?.auth_method || 'email',
        })

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }


  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px 24px 32px',
        marginTop: '-68px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`.nav{display:none !important}`}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
        }}
      />
      <div className="auth-deco auth-deco-1 hero-deco-card">
        <div className="hdc-badge b">Connect</div>
        <div className="hdc-val b">94%</div>
        <div className="hdc-text">Co-founder match score</div>
      </div>
      <div className="auth-deco auth-deco-2 hero-deco-card">
        <div className="hdc-badge g">Compete</div>
        <div className="hdc-val g">+18 ELO</div>
        <div className="hdc-text">Won last weekly duel</div>
      </div>
      <div className="auth-deco auth-deco-3 hero-deco-card">
        <div className="hdc-badge p">Learn</div>
        <div className="hdc-val p">Lesson 3</div>
        <div className="hdc-text">35% complete</div>
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (currentStep === 1) {
              goToNextStep()
            } else if (currentStep === 2) {
              goToNextStep()
            } else if (currentStep === 3) {
              handleSubmit()
            }
          }}
          style={{
            width: '100%',
            maxWidth: '480px',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            background: 'var(--card)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--text)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map((step) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step <= currentStep ? 'var(--green)' : 'var(--surface)',
                    color: step <= currentStep ? '#fff' : 'var(--text3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    border: step === currentStep ? '2px solid var(--green)' : '1px solid var(--border2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    style={{
                      width: '24px',
                      height: '2px',
                      background: step < currentStep ? 'var(--green)' : 'var(--border2)',
                      transition: 'all 0.2s ease'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Username and Terms */}
          {currentStep === 1 && (
            <>
              <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>
                Complete Your Profile
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '10px', marginBottom: '18px' }}>
                Choose a username and agree to our terms to get started.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={displayUsername}
                    onChange={(event) => {
                      const value = event.target.value
                      setDisplayUsername(value)
                      setUsername(value.replace(/[^a-zA-Z0-9]/g, '')) // Keep only alphanumeric for comparison
                    }}
                    required
                    placeholder="Choose a username"
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: '40px',
                      borderRadius: '10px',
                      border: '1px solid var(--border2)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  />
                  {usernameStatus && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '16px',
                      }}
                    >
                      {usernameStatus === 'checking' && '⏳'}
                      {usernameStatus === 'available' && '✅'}
                      {usernameStatus === 'taken' && '❌'}
                      {usernameStatus === 'invalid' && '❌'}
                    </div>
                  )}
                </div>
                {usernameStatus === 'taken' && (
                  <p style={{ color: '#fca5a5', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
                    Username taken
                  </p>
                )}
                {usernameStatus === 'available' && (
                  <p style={{ color: '#86efac', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
                    Username available
                  </p>
                )}
                {usernameStatus === 'invalid' && usernameError && (
                  <p style={{ color: '#fca5a5', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
                    {usernameError}
                  </p>
                )}
                {moderationError && (
                  <p style={{ color: '#fca5a5', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
                    {moderationError}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(event) => setAgeConfirmed(event.target.checked)}
                    required
                    style={{
                      marginTop: '2px',
                      accentColor: '#16a34a',
                    }}
                  />
                  <span style={{ color: 'var(--text)' }}>
                    I confirm I am 13 or older
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(event) => setAgreedToTerms(event.target.checked)}
                    required
                    style={{
                      marginTop: '2px',
                      accentColor: '#16a34a',
                    }}
                  />
                  <span style={{ color: 'var(--text)' }}>
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      style={{ color: '#16a34a', textDecoration: 'underline' }}
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="/privacy"
                      style={{ color: '#16a34a', textDecoration: 'underline' }}
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Step 2: Avatar and Theme */}
          {currentStep === 2 && (
            <>
              <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>
                Choose Your Avatar
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '10px', marginBottom: '18px' }}>
                Select an avatar and choose your preferred theme.
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
                  Select Avatar
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)', 
                  gap: '12px', 
                  marginBottom: '24px' 
                }}>
                  {PRESET_AVATARS.map((avatarItem) => (
                    <button
                      key={avatarItem.id}
                      type="button"
                      onClick={() => setAvatar(avatarItem.id)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        border: avatar === avatarItem.id 
                          ? `4px solid #fff` 
                          : '1px solid var(--border2)',
                        background: avatarItem.color,
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: avatar === avatarItem.id 
                          ? `0 4px 12px ${avatarItem.color}40` 
                          : 'var(--shadow-sm)',
                      }}
                    >
                      {username.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
                  Theme Preference
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: theme === 'dark' 
                        ? '2px solid var(--green)' 
                        : '1px solid var(--border2)',
                      background: theme === 'dark' 
                        ? 'var(--green-tint)' 
                        : 'var(--card)',
                      color: theme === 'dark' 
                        ? 'var(--green)' 
                        : 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    🌙 Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: theme === 'light' 
                        ? '2px solid var(--green)' 
                        : '1px solid var(--border2)',
                      background: theme === 'light' 
                        ? 'var(--green-tint)' 
                        : 'var(--card)',
                      color: theme === 'light' 
                        ? 'var(--green)' 
                        : 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    ☀️ Light
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Skills */}
          {currentStep === 3 && (
            <>
              <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>
                Select Your Skills
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '10px', marginBottom: '18px' }}>
                Choose up to 3 skills that best describe your expertise. (Optional)
              </p>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px', 
                  marginBottom: '24px' 
                }}>
                  {SKILLS_OPTIONS.map((skill) => {
                    const isSelected = skills.includes(skill)
                    const isDisabled = !isSelected && skills.length >= 3
                    
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        disabled={isDisabled}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: isSelected 
                            ? '2px solid var(--green)' 
                            : '1px solid var(--border2)',
                          background: isSelected 
                            ? 'var(--green-tint)' 
                            : isDisabled 
                            ? 'var(--surface)' 
                            : 'var(--card)',
                          color: isSelected 
                            ? 'var(--green)' 
                            : isDisabled 
                            ? 'var(--text3)' 
                            : 'var(--text)',
                          fontWeight: 600,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-display)',
                          transition: 'all 0.2s ease',
                          fontSize: '14px',
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
                
                              </div>
            </>
          )}


          {error && <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>{error}</p>}

          {currentStep === 1 && (
            <button
              type="submit"
              disabled={!isStep1Valid || loading}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '10px',
                background: isStep1Valid && !loading
                  ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                  : 'var(--surface)',
                color: isStep1Valid && !loading ? '#fff' : 'var(--text3)',
                fontWeight: 700,
                cursor: isStep1Valid && !loading ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)',
                boxShadow: isStep1Valid && !loading ? '0 8px 20px rgba(21,128,61,.28)' : 'none',
              }}
            >
              {loading ? 'Please wait...' : 'Continue'}
            </button>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={goToPreviousStep}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1.5px solid var(--border2)',
                  borderRadius: '10px',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.15s',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 8px 20px rgba(21,128,61,.28)',
                  transition: 'all 0.15s',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={goToPreviousStep}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1.5px solid var(--border2)',
                  borderRadius: '10px',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.15s',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: !loading
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : 'var(--surface)',
                  color: !loading ? '#fff' : 'var(--text3)',
                  fontWeight: 700,
                  cursor: !loading ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-display)',
                  boxShadow: !loading ? '0 8px 20px rgba(21,128,61,.28)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {loading ? 'Please wait...' : 'Go to dashboard →'}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
