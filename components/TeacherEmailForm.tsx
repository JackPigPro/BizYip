'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TeacherEmailForm() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('teacher_emails')
        .select('email')
        .eq('email', email)
        .single()

      if (existingEmail) {
        setError('This email is already registered for updates.')
        setIsSubmitting(false)
        return
      }

      // Insert new email
      const { error: insertError } = await supabase
        .from('teacher_emails')
        .insert({
          email: email.toLowerCase().trim(),
          created_at: new Date().toISOString(),
          status: 'pending'
        })

      if (insertError) {
        throw insertError
      }

      setIsSubmitted(true)
      setEmail('')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="teacher-form-success" style={{
        background: 'var(--card)',
        border: '2px solid var(--gold)',
        color: 'var(--text)',
        padding: '16px',
        borderRadius: '12px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>🎉</span>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>You're on the list!</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.4 }}>
          We'll email you when Learn launches in September.
        </div>
      </div>
    )
  }

  return (
    <div className="teacher-email-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your school email to get notified at launch"
          required
          style={{
            flex: 1,
            padding: '18px 24px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '18px',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--gold)'
            e.target.style.outline = 'none'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)'
          }}
        />
        
        <button
          type="submit"
          disabled={isSubmitting || !email}
          style={{
            padding: '18px 32px',
            borderRadius: '12px',
            border: 'none',
            background: isSubmitting || !email ? 'var(--border)' : 'var(--gold)',
            color: isSubmitting || !email ? 'var(--text3)' : 'white',
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: isSubmitting || !email ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isSubmitting ? 0.7 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Notify Me'}
        </button>
      </form>

      {error && (
        <div style={{
          color: 'var(--red)',
          fontSize: '14px',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
