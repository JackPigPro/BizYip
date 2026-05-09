'use client'



import Link from 'next/link'

import { useRouter, usePathname } from 'next/navigation'

import { LiveStats } from '@/utils/stats'

import { useLiveStats } from '@/hooks/useLiveStats'
import { useAppState } from '@/components/AppStateProvider'



interface FooterProps {

  onScrollTo: (id: string) => void

  stats?: LiveStats

}



export default function Footer({ onScrollTo, stats: serverStats }: FooterProps) {

  const router = useRouter()

  const pathname = usePathname()

  const { stats: clientStats } = useLiveStats()

  const { setHighlightLearn } = useAppState()

  

  // Use server stats if available (SSR), otherwise use client stats

  const stats = serverStats || clientStats



  const handleLandingNavigation = (sectionId: string) => {

    if (pathname === '/') {

      // Already on landing page, just scroll with center alignment like nav

      const el = document.getElementById(sectionId)

      if (!el) return

      const elRect = el.getBoundingClientRect()

      const elCenter = elRect.top + window.scrollY + elRect.height / 2

      const viewportCenter = window.innerHeight / 2

      window.scrollTo({ top: elCenter - viewportCenter, behavior: 'smooth' })

      // Add highlight animation for Learn section
      if (sectionId === 'learn') {
        setHighlightLearn(true)
        setTimeout(() => setHighlightLearn(false), 2000) // Remove highlight after 2 seconds
      }

    } else {

      // Navigate to landing page first, then scroll

      router.push(`/#${sectionId}`)

    }

  }



  return (

    <footer className="site-footer">

      <div className="sf-top">

        {/* Brand column */}

        <div className="sf-brand">

          <div className="sf-brand-row">

            <div className="nav-logo">B</div>

            <span className="sf-brand-name">BizYip</span>

          </div>

          <div className="sf-brand-desc">

            Daily challenges, weekly duels, live 1v1s. Build your ELO. Climb the leaderboard.

          </div>

                  </div>



        {/* Explore column */}

        <div>

          <div className="sf-col-title">Explore</div>

          <div className="sf-col-links">

            <Link href="/compete/leaderboard" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Leaderboard</Link>

            <a href="#compete" onClick={(e) => { e.preventDefault(); handleLandingNavigation('compete') }}>Compete</a>

            <Link href="/connect/ideas" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Create</Link>

            <a href="#connect" onClick={(e) => { e.preventDefault(); handleLandingNavigation('connect') }}>Connect</a>

            <a 
              href="#learn"
              onClick={(e) => {
                e.preventDefault()
                handleLandingNavigation('learn')
              }}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                textDecoration: 'none'
              }}>
              Learn
              <span
                style={{
                  fontSize: '10px',
                  background: 'var(--border)',
                  color: 'var(--text2)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)'
                }}
              >
                Coming Sep
              </span>
            </a>

          </div>

        </div>



        {/* Company column */}

        <div>

          <div className="sf-col-title">Company</div>

          <div className="sf-col-links">

            <Link href="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>About BizYip</Link>

            <Link href="/privacy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Privacy Policy</Link>

            <Link href="/terms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Terms of Service</Link>

            <Link href="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Contact</Link>

          </div>

        </div>

      </div>



      <div className="sf-bottom">

        <div className="sf-copy">© 2026 BizYip. All rights reserved.</div>

        <div className="sf-tagline">Where founders get good.</div>

        <div className="sf-socials">

          <a className="sf-social" href="https://x.com/BizYip" target="_blank" rel="noopener noreferrer" title="X">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">

              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>

            </svg>

          </a>

          <a className="sf-social" href="https://www.instagram.com/BizYip" target="_blank" rel="noopener noreferrer" title="Instagram">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">

              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>

            </svg>

          </a>

          <a className="sf-social" href="https://www.tiktok.com/@bizyip?lang=en" target="_blank" rel="noopener noreferrer" title="TikTok">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">

              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>

            </svg>

          </a>

          <a className="sf-social" href="https://www.youtube.com/@BizYip" target="_blank" rel="noopener noreferrer" title="YouTube">

            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">

              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.071 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>

            </svg>

          </a>

        </div>

      </div>

    </footer>

  )

}

