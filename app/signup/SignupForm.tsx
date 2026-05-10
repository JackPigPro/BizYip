'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SignupForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    // Check if email already exists in profiles table
    try {
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single()

      if (existingProfile && !profileCheckError) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return
      }
    } catch (checkError) {
      // Continue with signup if check fails
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.user && !data.session) {
      // Email confirmation required - create profile with email and auth_method
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email.toLowerCase(),
            auth_method: 'email',
            onboarding_complete: false,
          })
        setSuccess('Check your email to verify your account, then sign in.')
      } catch (profileError) {
        setError('Account created but profile setup failed. Please sign in to complete setup.')
      }
      return
    }

    if (data.session && data.user) {
      // User is signed in, create profile and redirect to onboarding
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email.toLowerCase(),
            auth_method: 'email',
            onboarding_complete: false,
          })
        router.push('/onboarding')
        router.refresh()
      } catch (profileError) {
        setError('Account created but profile setup failed. Please try signing in.')
      }
      return
    }

    setSuccess('Check your email to verify your account, then sign in.')
  }

  const onGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)
    setSuccess(null)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (oauthError) {
      // Keep this quiet for smooth UX; OAuth normally redirects away immediately.
      setGoogleLoading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: '16px',
        padding: '28px',
        background: 'rgba(10,14,26,.82)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 18px 45px rgba(0,0,0,.28)',
        color: '#fff',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(96,165,250,.82)', marginBottom: '10px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Join BizYip
      </div>
      <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', fontFamily: 'var(--font-display)' }}>Create your account</h1>
      <p style={{ color: 'rgba(255,255,255,.62)', marginTop: '10px', marginBottom: '18px' }}>Choose how you'd like to sign up.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.14)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '14px',
        }}
      >
        <Link
          href="/login"
          style={{
            textDecoration: 'none',
            textAlign: 'center',
            borderRadius: '8px',
            padding: '8px 10px',
            color: 'rgba(255,255,255,.72)',
            fontWeight: 700,
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
          }}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          style={{
            textDecoration: 'none',
            textAlign: 'center',
            borderRadius: '8px',
            padding: '8px 10px',
            background: 'rgba(34,197,94,.18)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
          }}
        >
          Sign Up
        </Link>
      </div>

      <button
        type="button"
        onClick={onGoogleSignup}
        disabled={googleLoading || loading}
        style={{
          width: '100%',
          marginBottom: '14px',
          padding: '11px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(255,255,255,.08)',
          color: '#fff',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,.18)' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', letterSpacing: '1px', textTransform: 'uppercase' }}>or</span>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,.18)' }} />
      </div>

      <label style={{ display: 'block', marginBottom: '7px', color: 'rgba(255,255,255,.88)', fontWeight: 600, fontSize: '14px' }}>Email</label>
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
          border: '1px solid rgba(255,255,255,.16)',
          background: 'rgba(255,255,255,.06)',
          color: '#fff',
          outline: 'none',
        }}
      />

      <label style={{ display: 'block', marginBottom: '7px', color: 'rgba(255,255,255,.88)', fontWeight: 600, fontSize: '14px' }}>Password</label>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={6}
        placeholder="At least 6 characters"
        style={{
          width: '100%',
          marginBottom: '14px',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,.16)',
          background: 'rgba(255,255,255,.06)',
          color: '#fff',
          outline: 'none',
        }}
      />

      {error && <p style={{ color: '#fca5a5', marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>{error}</p>}
      {success && (
        <p
          style={{
            color: '#86efac',
            marginTop: 0,
            marginBottom: '10px',
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

      <button
        type="submit"
        disabled={loading || googleLoading}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          boxShadow: '0 8px 20px rgba(21,128,61,.28)',
        }}
      >
        {loading ? 'Creating account...' : 'Create account with Email'}
      </button>

      <p style={{ marginBottom: 0, marginTop: '14px', color: 'rgba(255,255,255,.62)' }}>
        Already have an account? <Link href="/login" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
      </p>
    </form>
  )
}
