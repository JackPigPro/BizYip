'use client'

import { useState } from 'react'
import { containsBannedWord, validateAndLogContent } from '@/lib/moderation'

interface CreateIdeaFormProps {
  onSubmit: (ideaData: { title: string; content: string; is_public: boolean }) => Promise<void>
  userId?: string
}

export default function CreateIdeaForm({ onSubmit, userId }: CreateIdeaFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    // Check for banned words in title
    if (containsBannedWord(title)) {
      setTitleError('Inappropriate content. Please rewrite.')
      return
    }

    // Check for banned words in content
    if (containsBannedWord(content)) {
      setContentError('Inappropriate content. Please rewrite.')
      return
    }

    // Clear errors
    setTitleError(null)
    setContentError(null)
    setError(null)

    try {
      setSubmitting(true)
      
      // Log moderation checks and validate
      if (userId) {
        const titleModerationResult = await validateAndLogContent(userId, title.trim(), 'idea_title')
        if (!titleModerationResult.isValid) {
          setTitleError(titleModerationResult.error || 'Inappropriate content. Please rewrite.')
          return
        }

        const contentModerationResult = await validateAndLogContent(userId, content.trim(), 'idea_content')
        if (!contentModerationResult.isValid) {
          setContentError(contentModerationResult.error || 'Inappropriate content. Please rewrite.')
          return
        }
      }
      
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic,
      })

      // Reset form
      setTitle('')
      setContent('')
      setIsPublic(true)
    } catch (err) {
      console.error('Error submitting idea:', err)
      setError('Failed to create idea. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      height: 'fit-content',
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '16px',
        fontFamily: 'var(--font-display)',
        color: 'var(--text)',
      }}>
        Share Your Idea
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <input
            type="text"
            placeholder="Give your idea a catchy title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setTitleError(null)
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
            maxLength={200}
          />
          {titleError && (
            <p style={{ color: '#fca5a5', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
              {titleError}
            </p>
          )}
        </div>

        <div>
          <textarea
            placeholder="Describe your idea in detail..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setContentError(null)
            }}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              background: 'var(--bg)',
              color: 'var(--text)',
              resize: 'vertical',
            }}
            maxLength={2000}
          />
          {contentError && (
            <p style={{ color: '#fca5a5', marginTop: '4px', marginBottom: 0, fontSize: '12px' }}>
              {contentError}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <div
              onClick={() => setIsPublic(!isPublic)}
              style={{
                position: 'relative',
                width: '48px',
                height: '24px',
                background: isPublic ? 'var(--green)' : 'var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isPublic ? '26px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '10px',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text2)', fontWeight: 500 }}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </label>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--red)',
            color: 'white',
            borderRadius: '6px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          style={{
            padding: '12px 24px',
            background: submitting ? 'var(--border)' : 'var(--green)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background-color 0.2s',
          }}
        >
          {submitting ? 'Posting...' : 'Post Idea'}
        </button>
      </form>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--card2)',
        borderRadius: '6px',
        fontSize: '12px',
        color: 'var(--text3)',
        lineHeight: 1.5,
      }}>
        <strong>Tips:</strong> Be specific about the problem you're solving and who your target audience is. The more detail you provide, the better feedback you'll receive.
      </div>
    </div>
  )
}
