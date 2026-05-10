'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const supabase = createClient()

  // Helper function to check auth method using server API
  const getAuthMethodForEmail = async (email: string): Promise<'email' | 'google' | null> => {
    try {
      const response = await fetch(`/api/auth/check-method?email=${encodeURIComponent(email.toLowerCase())}`)
      
      if (!response.ok) {
        console.error('Failed to check auth method:', response.statusText)
        return null
      }
      
      const data = await response.json()
      return data.authMethod as 'email' | 'google' | null
    } catch (error) {
      console.error('Error checking auth method:', error)
      return null
    }
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showVerificationScreen, setShowVerificationScreen] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Force password mode when in signup mode (no magic links for signup)
  useEffect(() => {
    if (mode === 'signup' && authMode === 'magic') {
      setAuthMode('password')
      setStep('email')
    }
  }, [mode, authMode])

  // Listen for auth state changes when verification screen is showing
  useEffect(() => {
    if (!showVerificationScreen) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User has verified their email, redirect to onboarding
        router.push('/onboarding')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [showVerificationScreen, router, supabase])

  const onContinueWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    try {
      console.log('Checking auth method for email:', email)
      
      // Check auth method using our new helper function
      const authMethod = await getAuthMethodForEmail(email)
      console.log('🔍 Auth method result for', email, ':', authMethod)
      
      if (authMethod === null) {
        console.log('No account found for email:', email)
        setError('No account found with that email. Please sign up first.')
        setLoading(false)
        return
      }

      // Check auth method - magic links only for email accounts
      if (authMethod === 'google') {
        console.log('Google account trying to use magic link:', email)
        setError('This account was created with Google. Please sign in with Google.')
        setLoading(false)
        return
      }

      console.log('Profile found, sending magic link for email:', email)
      
      // Send magic link with correct options (don't create user)
      const { error: otpError, data } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new users
        },
      })

      console.log('OTP response:', { error: otpError, data })

      if (otpError) {
        console.error('OTP Error details:', {
          message: otpError.message,
          status: otpError.status,
          code: otpError.code,
          name: otpError.name,
          stack: otpError.stack
        })
        setError(otpError.message)
        return
      }

      setStep('code')
    } catch (unexpectedError) {
      console.error('Unexpected error during OTP sign in:', unexpectedError)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    })

    setLoading(false)

    if (verifyError) {
      setError('Invalid or expired code. Please try again.')
      return
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      setError('Authentication error')
      return
    }

    // Magic link users are existing accounts - go directly to dashboard
    // No need to check onboarding since they've already completed it
    router.push('/')
    router.refresh()
  }

  const onGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)

    // Check if email exists and was created with email/password
    if (email.trim()) {
      const authMethod = await getAuthMethodForEmail(email)
      
      if (authMethod === 'email') {
        setError('This account was created with email and password. Please sign in with your email and password.')
        setGoogleLoading(false)
        return
      }
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    })

    if (oauthError) {
      // Keep this quiet for smooth UX; OAuth normally redirects away immediately.
      setGoogleLoading(false)
    }
  }

  const onPasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          return
        }

        if (password !== confirmPassword) {
          setError('Passwords don\'t match')
          return
        }

        // Check if email already exists in profiles table before signup
        console.log('🔍 Checking if email exists in profiles:', email)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', email.toLowerCase())
          .single()
        
        if (existingProfile) {
          console.log('❌ Email already exists in profiles:', email)
          setError('An account with this email already exists. Please sign in instead.')
          setLoading(false)
          return
        }

        // Sign up with password
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) {
          // Handle case where email already exists with Google OAuth
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
            setError('This email is already registered with Google. Try signing in with Google instead.')
          } else {
            setError(signUpError.message)
          }
          return
        }

        // Show verification screen instead of redirecting
        setShowVerificationScreen(true)
        // Start resend cooldown
        setResendCooldown(60)
        const cooldownInterval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // Check auth method before signing in with password
        const authMethod = await getAuthMethodForEmail(email)

        if (authMethod === 'google') {
          setError('This account was created with Google. Please sign in with Google.')
          setLoading(false)
          return
        }

        // Sign in with password
        console.log('🔑 Attempting password sign in for:', email)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          console.error('❌ Sign in error:', signInError)
          setError(signInError.message)
          setLoading(false)
          return
        }

        console.log('✅ Sign in successful, getting user data...')
        console.log('📍 About to call supabase.auth.getUser()...')
        // Get current user and check onboarding
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('📍 supabase.auth.getUser() completed')
        
        if (userError || !user) {
          console.log('📍 Entering user error branch')
          console.error('❌ Error getting user after sign in:', userError)
          setError('Authentication error')
          setLoading(false)
          return
        }
        console.log('📍 Passed user error check')

        console.log('✅ User data retrieved:', user.id)
        console.log('📍 About to query onboarding status...')
        // Check if user has completed onboarding with timeout
        let onboardingProfile, onboardingError
        try {
          const queryPromise = supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()
          
          // Add 5 second timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
          
          const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any, error: any }
          onboardingProfile = result.data
          onboardingError = result.error
        } catch (error) {
          console.error('❌ Onboarding query failed or timed out:', error)
          onboardingError = error
          onboardingProfile = null
        }
        console.log('📍 Onboarding query completed')

        if (onboardingError) {
          console.log('📍 Entering onboarding error branch')
          console.error('❌ Error checking onboarding status:', onboardingError)
          setError('Error checking profile status')
          setLoading(false)
          return
        }
        console.log('📍 Passed onboarding error check')

        const redirectTo = onboardingProfile?.onboarding_complete ? '/' : '/onboarding'
        console.log('🔄 About to redirect to:', redirectTo, 'onboarding_complete:', onboardingProfile?.onboarding_complete)
        console.log('📍 About to call router.push()...')
        router.push(redirectTo)
        console.log('📍 router.push() completed')
        console.log('📍 About to call router.refresh()...')
        router.refresh()
        console.log('📍 router.refresh() completed')
      }
    } catch (unexpectedError) {
      console.error('Unexpected error during password auth:', unexpectedError)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (authMode === 'password') {
      await onPasswordAuth(event)
      return
    }

    if (step === 'email') {
      await onContinueWithEmail(event)
      return
    }

    await onVerifyCode(event)
  }

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        email,
        type: 'signup',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (resendError) {
        setError(resendError.message)
        return
      }
      
      // Restart cooldown
      setResendCooldown(60)
      const cooldownInterval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setSuccess('Verification email resent!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (unexpectedError) {
      console.error('Unexpected error during resend:', unexpectedError)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetToSignupForm = () => {
    setShowVerificationScreen(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setResendCooldown(0)
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: '544px',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        background: 'var(--card)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text)',
        position: 'relative',
        zIndex: 1,
        transition: 'max-width 0.2s ease-in-out',
      }}
    >
      {showVerificationScreen ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* Email icon/checkmark */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16,185,129,.28)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
            Check your inbox
          </h1>
          
          <p style={{ color: 'var(--text2)', fontSize: '16px', lineHeight: '1.5', marginBottom: '32px' }}>
            We sent a verification link to <strong>{email}</strong>.<br/>
            Click it to activate your account.
          </p>
          
          {error && (
            <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </p>
          )}
          
          {success && (
            <p style={{
              color: '#86efac',
              marginTop: 0,
              marginBottom: '16px',
              fontSize: '14px',
              background: 'rgba(22,163,74,.15)',
              border: '1px solid rgba(22,163,74,.35)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}>
              {success}
            </p>
          )}
          
          <button
            type="button"
            onClick={resendVerificationEmail}
            disabled={resendCooldown > 0 || loading}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              background: 'transparent',
              color: resendCooldown > 0 ? 'var(--text3)' : 'var(--text)',
              fontWeight: 600,
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              marginBottom: '12px',
              opacity: resendCooldown > 0 ? 0.6 : 1,
            }}
          >
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
          </button>
          
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={resetToSignupForm}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text2)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              Wrong email? Go back
            </button>
          </div>
        </div>
      ) : (
        <>
      <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>
        {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
      </h1>
      <p style={{ color: 'var(--text2)', marginTop: '10px', marginBottom: '18px' }}>
        Choose how you'd like to {mode === 'signup' ? 'sign up' : 'sign in'}.
      </p>

      {/* Google Button - Always visible */}
      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={googleLoading || loading}
        style={{
          width: '100%',
          marginBottom: '14px',
          padding: '11px 12px',
          borderRadius: '10px',
          border: '1px solid var(--border2)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.9-4.2 2.9-7.1 0-.7-.1-1.4-.2-2H12Z" />
          <path fill="#34A853" d="M12 21c2.6 0 4.7-.9 6.2-2.3l-3.1-2.4c-.9.6-1.9.9-3.1.9-2.4 0-4.5-1.6-5.2-3.9H3.6v2.5A9.4 9.4 0 0 0 12 21Z" />
          <path fill="#4A90E2" d="M6.8 13.3a5.7 5.7 0 0 1 0-3.6V7.2H3.6a9.4 9.4 0 0 0 0 8.5l3.2-2.4Z" />
          <path fill="#FBBC05" d="M12 6.8c1.4 0 2.6.5 3.5 1.4l2.6-2.6A9.2 9.2 0 0 0 12 3 9.4 9.4 0 0 0 3.6 7.2l3.2 2.5c.7-2.3 2.8-3.9 5.2-3.9Z" />
        </svg>
        {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
      </button>

      {/* Divider - Always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ height: '1px', flex: 1, background: 'var(--border2)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase' }}>or</span>
        <div style={{ height: '1px', flex: 1, background: 'var(--border2)' }} />
      </div>

      {/* Error/Success messages */}
      {error && <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '14px', fontSize: '14px' }}>{error}</p>}
      {success && (
        <p
          style={{
            color: '#86efac',
            marginTop: 0,
            marginBottom: '14px',
            fontSize: '14px',
            background: 'rgba(22,163,74,.15)',
            border: '1px solid rgba(22,163,74,.35)',
            borderRadius: '10px',
            padding: '10px 12px',
          }}
        >
          {success}
        </p>
      )}

      {/* Password Mode */}
      {authMode === 'password' && step === 'email' && (
        <div style={{
          transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
          opacity: 1,
          transform: 'translateY(0)',
        }}>
          <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: '100%',
              marginBottom: '14px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />

          <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>Password</label>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                paddingRight: '40px',
                borderRadius: '10px',
                border: '1px solid var(--border2)',
                background: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text2)',
              }}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {mode === 'signup' && (
            <>
              <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>Confirm password</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border2)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text2)',
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 8px 20px rgba(59,130,246,.28)',
              marginBottom: '8px',
            }}
          >
            {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </button>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: '12px' }}>
              <Link
                href="/forgot-password"
                style={{
                  color: 'var(--text2)',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('magic')
                  setError(null)
                  setSuccess(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text2)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Send a magic link instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* Magic Link Mode - Only show for login mode */}
      {authMode === 'magic' && step === 'email' && mode === 'login' && (
        <div style={{
          transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
          opacity: 1,
          transform: 'translateY(0)',
        }}>
          <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: '100%',
              marginBottom: '14px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 8px 20px rgba(59,130,246,.28)',
              marginBottom: '12px',
            }}
          >
            {loading ? 'Sending magic link...' : 'Send magic link'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password')
                setError(null)
                setSuccess(null)
                setStep('email')
                // Navigate to login mode
                router.push('/login?mode=login')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text2)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              Login with password instead
            </button>
          </div>

        </div>
      )}

      {/* Code verification mode */}
      {step === 'code' && (
        <div style={{
          transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
          opacity: 1,
          transform: 'translateY(0)',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--text2)', marginBottom: '14px' }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>Verification Code</label>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            maxLength={6}
            placeholder="123456"
            style={{
              width: '100%',
              marginBottom: '14px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
              fontSize: '18px',
              textAlign: 'center',
              letterSpacing: '4px',
            }}
          />

          {error && <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 8px 20px rgba(59,130,246,.28)',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email')
              setError(null)
              setSuccess(null)
              setAuthMode('magic')
            }}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'var(--text2)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}
          >
            Back to Email
          </button>
        </div>
      )}

        </>
      )}
    </form>
  )
}
