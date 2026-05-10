'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ResetPasswordComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Verify the reset token is valid
    const verifyToken = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      
      if (!accessToken || !refreshToken) {
        setError('Invalid or expired reset link. Please request a new password reset.')
        setTokenValid(false)
        return
      }

      try {
        // Set the session using the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setError('Invalid or expired reset link. Please request a new password reset.')
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (err) {
        setError('Invalid or expired reset link. Please request a new password reset.')
        setTokenValid(false)
      }
    }

    verifyToken()
  }, [searchParams, supabase])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Password updated successfully! Redirecting to login...')
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login?mode=login')
      }, 2000)
    } catch (unexpectedError) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text2)' }}>Verifying reset link...</p>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#fca5a5', marginBottom: '20px' }}>{error}</p>
        <a
          href="/forgot-password"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Request new reset link
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
        New Password
      </label>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        placeholder="Enter new password"
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

      <label style={{ display: 'block', marginBottom: '7px', color: 'var(--text)', fontWeight: 600, fontSize: '14px' }}>
        Confirm New Password
      </label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        placeholder="Confirm new password"
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
        {loading ? 'Updating password...' : 'Update Password'}
      </button>
    </form>
  )
}
