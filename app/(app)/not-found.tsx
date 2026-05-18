'use client'

import { useUser } from '@/contexts/UserContext'
import Link from 'next/link'

export default function NotFound() {
  const { isAuthenticated, authLoading } = useUser()

  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '3px solid var(--border)', 
          borderTop: '3px solid var(--green)', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        {/* 404 Text */}
        <div style={{ 
          fontSize: '120px', 
          fontWeight: 800, 
          fontFamily: 'var(--font-display)', 
          color: 'var(--text)',
          marginBottom: '24px',
          letterSpacing: '-4px',
          lineHeight: '1'
        }}>
          404
        </div>

        {/* Message */}
        <div style={{ 
          fontSize: '24px', 
          fontFamily: 'var(--font-body)', 
          color: 'var(--text2)',
          marginBottom: '48px',
          lineHeight: '1.4'
        }}>
          This page doesn't exist.
        </div>

        {/* Button */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 32px',
            background: 'var(--green)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.1px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(34, 197, 94, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(34, 197, 94, 0.2)'
          }}
        >
          {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
