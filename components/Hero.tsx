'use client'

import Link from 'next/link'
import { LiveStats } from '@/utils/stats'
import { useLiveStats } from '@/hooks/useLiveStats'

interface HeroProps {
  onScrollTo: (id: string) => void
  stats?: LiveStats
}

export default function Hero({ onScrollTo, stats: serverStats }: HeroProps) {
  const { stats: clientStats } = useLiveStats()
  
  // Use server stats if available (SSR), otherwise use client stats
  const stats = serverStats || clientStats
  return (
    <section className="hero" id="top">
      <div className="hero-bg"></div>

      {/* Floating decoration cards */}
      <div className="hero-deco-card hdc-1">
        <div className="hdc-badge b">🤝 Connect</div>
        <div className="hdc-text">Marcus T. — Co-founder match</div>
        <div className="hdc-chip b">Full-stack Dev</div>
      </div>

      <div className="hero-deco-card hdc-2">
        <div className="hdc-badge g">⚔️ Compete</div>
        <div className="hdc-val g">+18</div>
        <div className="hdc-text">Won Weekly Competition</div>
        <div className="hdc-chip g">Now: Founder rank 🏅</div>
      </div>

      <div className="hero-deco-card hdc-3">
        <div className="hdc-badge p">� Daily Bellringer</div>
        <div className="hdc-val p">Day 3</div>
        <div className="hdc-text">Market Without Money</div>
        <div className="hdc-meta">Streak: 3 days · 2h left</div>
      </div>

      <div className="hero-deco-card hdc-4">
        <div className="hdc-badge o">💡 Idea</div>
        <div className="hdc-val o">7 replies</div>
        <div className="hdc-text">&ldquo;ParkShare — Airbnb for driveways&rdquo;</div>
        <div className="hdc-meta">2 co-founder requests received</div>
      </div>

      {/* Main headline */}
      <div style={{ marginBottom: '10px', fontSize: '13px', letterSpacing: '2.4px', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Built by founders, for founders
      </div>
      <h1 className="hero-h1">
        Stop watching,<br /><em>start building.</em>
      </h1>

      {/* Subtitle */}
      <p className="hero-sub">
        Share your idea, get real feedback, match and meet aspiring founders, and compete in weekly founder competitions.
      </p>

      {/* CTA buttons - UPDATED TO USE LINK */}
      <div className="hero-actions">
        <Link 
          href="/login?mode=signup" 
          className="btn-cta-primary" 
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ⚡ Get Started Free
        </Link>
        <Link 
          href="/login?mode=login" 
          className="btn-cta-ghost" 
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Sign In →
        </Link>
      </div>

      
      {/* Pillar cards */}
      <div className="pillar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="pillar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div
            className="pillar-header-item connect"
            onClick={() => onScrollTo('connect')}
            style={{ cursor: 'pointer' }}
          >
            🤝 Connect
          </div>
          <div className="pillar-header-arrow"></div>
          <div
            className="pillar-header-item compete"
            onClick={() => onScrollTo('compete')}
            style={{ cursor: 'pointer' }}
          >
            ⚔️ Compete
          </div>
        </div>

        <div className="pillar-row" style={{ display: 'flex', justifyContent: 'center', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
          {/* CONNECT pillar card */}
          <div className="pc connect" onClick={() => onScrollTo('connect')}>
            <div className="pc-top">
              <span className="pc-icon">🤝</span>
              <span className="pc-label connect">Connect</span>
            </div>
            <div className="pc-title">Post Ideas &amp; Find Co-Founders</div>
            <p className="pc-desc">
              Post your startup idea, get real feedback from other builders, and find someone to build it with.
            </p>
            <button
              className="pc-cta connect"
              onClick={(e) => { e.stopPropagation(); onScrollTo('connect') }}
            >
              Explore more →
            </button>
            <div className="pc-preview">
              <div className="pc-cf">
                <div className="pc-cf-title">Co-Founder Match</div>
                <div className="pc-cf-card">
                  <div className="pc-cf-top">
                    <div className="pc-cf-av">M</div>
                    <div className="pc-cf-name">Marcus T.</div>
                  </div>
                  <div className="pc-cf-bio">Full-stack dev looking to build in fintech or edtech.</div>
                  <div className="pc-cf-skills">
                    <div className="pc-cf-skill">React</div>
                    <div className="pc-cf-skill">Python</div>
                    <div className="pc-cf-skill">Fintech</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPETE pillar card */}
          <div className="pc compete" onClick={() => onScrollTo('compete')}>
            <div className="pc-top">
              <span className="pc-icon">⚔️</span>
              <span className="pc-label compete">Compete</span>
            </div>
            <div className="pc-title">Daily Duels &amp; Weekly Competitions</div>
            <p className="pc-desc">
              Daily head-to-head battles and weekly tournaments. Compete, climb the ELO ladder, and prove your thinking.
            </p>
            <button
              className="pc-cta compete"
              onClick={(e) => { e.stopPropagation(); onScrollTo('compete') }}
            >
              Explore more →
            </button>
            <div className="pc-preview">
              <div className="pc-lb">
                <div className="pc-lb-title">
                  Weekly Leaderboard
                  <div className="pc-lb-live">
                    <div className="pc-lb-dot"></div>342 live
                  </div>
                </div>
                <div className="pc-lb-row">
                  <div className="pc-lb-rank">🥇</div>
                  <div className="pc-lb-av">D</div>
                  <div className="pc-lb-name">DesignWolf</div>
                  <div className="pc-lb-elo">1,891</div>
                  <div className="pc-lb-delta">↑3</div>
                </div>
                <div className="pc-lb-row">
                  <div className="pc-lb-rank">🥈</div>
                  <div className="pc-lb-av">N</div>
                  <div className="pc-lb-name">NeonBrush</div>
                  <div className="pc-lb-elo">1,756</div>
                  <div className="pc-lb-delta">↑1</div>
                </div>
                <div className="pc-lb-row you-row">
                  <div className="pc-lb-rank" style={{ color: 'var(--green)', fontSize: '10px' }}>#47</div>
                  <div className="pc-lb-av" style={{ background: 'var(--green-mid)' }}>J</div>
                  <div className="pc-lb-name" style={{ color: 'var(--green)', fontWeight: 700 }}>you</div>
                  <div className="pc-lb-elo">1,240</div>
                  <div className="pc-lb-delta">↑4</div>
                </div>
              </div>
            </div>
          </div>

                  </div>
      </div>
    </section>
  )
}