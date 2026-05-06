'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Hero from './Hero'
import ConnectSection from './ConnectSection'
import CompeteSection from './CompeteSection'
import { LiveStats } from '@/utils/stats'

interface LandingProps {
  onScrollTo?: (id: string) => void
  stats?: LiveStats
}

export default function Landing({ onScrollTo, stats }: LandingProps = {}) {

  const scrollToCenter = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const elRect = el.getBoundingClientRect()
    const elCenter = elRect.top + window.scrollY + elRect.height / 2
    const viewportCenter = window.innerHeight / 2
    window.scrollTo({ top: elCenter - viewportCenter, behavior: 'smooth' })
    onScrollTo?.(id)
  }, [onScrollTo])

  // Handle URL hash for section scrolling
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const hash = window.location.hash.slice(1) // Remove # from hash
    if (!hash || !['connect', 'compete'].includes(hash)) return
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollToCenter(hash)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [scrollToCenter])

  return (
    <div id="landing">
      <Hero onScrollTo={scrollToCenter} stats={stats} />
      <ConnectSection />
      <CompeteSection />
      
      {/* Call-to-action section above footer */}
      <section
        style={{
          padding: '120px 24px 86px',
          backgroundImage:
            'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ marginBottom: '10px', fontSize: '13px', letterSpacing: '2.4px', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Built by founders, for founders
          </div>
          <h3
            style={{
              fontSize: '78px',
              fontWeight: 800,
              letterSpacing: '-3.5px',
              lineHeight: '.95',
              margin: '0 0 20px',
              color: 'var(--text)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Stop watching,<br />
            <span style={{ color: 'var(--green)' }}>start building.</span>
          </h3>
          <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '18px', lineHeight: 1.65 }}>
            Compete in Daily Duels, climb the weekly tournaments, and prove you can build. Join thousands of founders turning ideas into reality.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/signup"
              className="btn-cta-primary"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ⚡ Start Building Free
            </Link>
            <Link
              href="/login"
              className="btn-cta-ghost"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Sign In →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

