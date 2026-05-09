'use client'

import { FormEvent, useState, useEffect } from 'react'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface OnboardingData {
  username: string
  ageConfirmed: boolean
  agreedToTerms: boolean
  avatar: string
  theme: 'light' | 'dark'
  skills: string[]
}

const PRESET_AVATARS = [
  { id: 'avatar-1', color: '#16a34a', emoji: '🚀' },
  { id: 'avatar-2', color: '#2563eb', emoji: '💡' },
  { id: 'avatar-3', color: '#7c3aed', emoji: '🎯' },
  { id: 'avatar-4', color: '#ea580c', emoji: '⚡' },
  { id: 'avatar-5', color: '#dc2626', emoji: '🔥' },
  { id: 'avatar-6', color: '#0891b2', emoji: '💎' },
  { id: 'avatar-7', color: '#be123c', emoji: '🌟' },
  { id: 'avatar-8', color: '#059669', emoji: '🎨' },
  { id: 'avatar-9', color: '#7c2d12', emoji: '🏆' },
  { id: 'avatar-10', color: '#4338ca', emoji: '🎪' }
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
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    username: '',
    ageConfirmed: false,
    agreedToTerms: false,
    avatar: PRESET_AVATARS[0].id,
    theme: 'dark',
    skills: []
  })
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Apply theme immediately when changed
  useEffect(() => {
    document.body.setAttribute('data-theme', onboardingData.theme)
  }, [onboardingData.theme])

  // Show loading state while checking auth and profile
  if (authLoading) {
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
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: 'var(--text)', 
            fontFamily: 'var(--font-display)', 
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Loading your profile...
          </div>
        </div>
      </main>
    )
  }

  // Check auth state and render onboarding UI
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()
          
          // Handle the case where profile doesn't exist or onboarding is not complete
          if (error || !profile || profile.onboarding_complete === false) {
            setAuthLoading(false)
          } else {
            // Profile exists and onboarding complete, redirect to dashboard
            router.push('/dashboard')
            return
          }
        } else {
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setAuthLoading(false)
      }
    }

    checkAuthState()
  }, [])

  // Check username availability in real-time
  useEffect(() => {
    if (!onboardingData.username.trim()) {
      setUsernameStatus(null)
      setUsernameError(null)
      return
    }

    // Validate username rules
    const validationRules = [
      {
        test: onboardingData.username.length >= 3 && onboardingData.username.length <= 20,
        message: 'Username must be 3-20 characters'
      },
      {
        test: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(onboardingData.username),
        message: 'Username must start with a letter and contain only letters, numbers, and underscores'
      }
    ]

    const failedRule = validationRules.find(rule => !rule.test)
    if (failedRule) {
      setUsernameStatus('invalid')
      setUsernameError(failedRule.message)
      return
    }

    setUsernameError(null)

    const checkUsername = async () => {
      setUsernameStatus('checking')
      
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(onboardingData.username.trim().toLowerCase())}`)
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
  }, [onboardingData.username, supabase])

  const isFormValid = usernameStatus === 'available' && onboardingData.ageConfirmed && onboardingData.agreedToTerms

  const handleSubmit = async () => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
    if (!usernameRegex.test(onboardingData.username.trim())) {
      setUsernameError('Username must start with a letter and contain only letters, numbers, and underscores')
      return
    }
    
    if (!isFormValid) return

    setLoading(true)
    setError(null)

    try {
      // Call API route to complete onboarding
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: onboardingData.username.trim(),
          avatar: onboardingData.avatar,
          theme: onboardingData.theme,
          skills: onboardingData.skills
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete onboarding')
      }

      const result = await response.json()

      // Don't reset loading state on success since we're about to redirect
      // This prevents the button from flashing back to "Continue" before redirect
      
      // Small delay to ensure UI updates before redirect
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  // Step navigation functions
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
    setOnboardingData(prev => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
      return { ...prev, skills: newSkills }
    })
  }

  // Step Indicator Component
  const StepIndicator = () => (
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
  )

  // Step 1: Username and Age Confirmation
  const Step1 = () => (
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
            value={onboardingData.username}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
              setOnboardingData(prev => ({ ...prev, username: cleaned }))
            }}
            required
            placeholder="Choose a username"
            maxLength={20}
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
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={onboardingData.ageConfirmed}
            onChange={(event) => setOnboardingData(prev => ({ ...prev, ageConfirmed: event.target.checked }))}
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
            checked={onboardingData.agreedToTerms}
            onChange={(event) => setOnboardingData(prev => ({ ...prev, agreedToTerms: event.target.checked }))}
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

      {error && <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>{error}</p>}

      <button
        type="button"
        onClick={goToNextStep}
        disabled={!isFormValid}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '10px',
          background: isFormValid 
            ? 'linear-gradient(135deg, #16a34a, #22c55e)' 
            : 'var(--surface)',
          color: isFormValid ? '#fff' : 'var(--text3)',
          fontWeight: 700,
          cursor: isFormValid ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-display)',
          boxShadow: isFormValid ? '0 8px 20px rgba(21,128,61,.28)' : 'none',
        }}
      >
        Continue
      </button>
    </>
  )

  // Step 2: Avatar and Theme Selection
  const Step2 = () => (
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
          {PRESET_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setOnboardingData(prev => ({ ...prev, avatar: avatar.id }))}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                border: onboardingData.avatar === avatar.id 
                  ? `3px solid ${avatar.color}` 
                  : '1px solid var(--border2)',
                background: avatar.color + '20',
                color: 'var(--text)',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: onboardingData.avatar === avatar.id 
                  ? `0 4px 12px ${avatar.color}40` 
                  : 'var(--shadow-sm)',
              }}
            >
              {avatar.emoji}
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
            onClick={() => setOnboardingData(prev => ({ ...prev, theme: 'light' }))}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: onboardingData.theme === 'light' 
                ? '2px solid var(--green)' 
                : '1px solid var(--border2)',
              background: onboardingData.theme === 'light' 
                ? 'var(--green-tint)' 
                : 'var(--card)',
              color: onboardingData.theme === 'light' 
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
          <button
            type="button"
            onClick={() => setOnboardingData(prev => ({ ...prev, theme: 'dark' }))}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: onboardingData.theme === 'dark' 
                ? '2px solid var(--green)' 
                : '1px solid var(--border2)',
              background: onboardingData.theme === 'dark' 
                ? 'var(--green-tint)' 
                : 'var(--card)',
              color: onboardingData.theme === 'dark' 
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
        </div>
      </div>

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
          type="button"
          onClick={goToNextStep}
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
    </>
  )

  // Step 3: Skills Selection
  const Step3 = () => (
    <>
      <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>
        Select Your Skills
      </h1>
      <p style={{ color: 'var(--text2)', marginTop: '10px', marginBottom: '18px' }}>
        Choose up to 3 skills that best describe your expertise.
      </p>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px', 
          marginBottom: '24px' 
        }}>
          {SKILLS_OPTIONS.map((skill) => {
            const isSelected = onboardingData.skills.includes(skill)
            const isDisabled = !isSelected && onboardingData.skills.length >= 3
            
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
        
        <p style={{ 
          color: 'var(--text2)', 
          fontSize: '12px', 
          marginBottom: '20px',
          textAlign: 'center' 
        }}>
          {onboardingData.skills.length}/3 skills selected
        </p>
      </div>

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
          type="button"
          onClick={handleSubmit}
          disabled={onboardingData.skills.length === 0 || loading}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '10px',
            background: onboardingData.skills.length > 0 && !loading
              ? 'linear-gradient(135deg, #16a34a, #22c55e)' 
              : 'var(--surface)',
            color: onboardingData.skills.length > 0 && !loading ? '#fff' : 'var(--text3)',
            fontWeight: 700,
            cursor: onboardingData.skills.length > 0 && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-display)',
            boxShadow: onboardingData.skills.length > 0 && !loading ? '0 8px 20px rgba(21,128,61,.28)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'Please wait...' : 'Go to dashboard →'}
        </button>
      </div>
    </>
  )
}
