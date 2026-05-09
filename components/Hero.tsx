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
        <div className="hdc-badge g">⚔️ Compete</div>
        <div className="hdc-val g">+5 ELO</div>
        <div className="hdc-text">Live 1v1 Win</div>
        <div className="hdc-chip g">Now: Creator rank 🏅</div>
      </div>

      <div className="hero-deco-card hdc-2">
        <div className="hdc-badge o">💡 Create</div>
        <div className="hdc-val o">7 comments</div>
        <div className="hdc-text">&ldquo;ParkShare – Airbnb for driveways&rdquo;</div>
      </div>

      <div className="hero-deco-card hdc-3">
        <div className="hdc-badge b">👋 Connect</div>
        <div className="hdc-val b">Marcus T.</div>
        <div className="hdc-text">2 co-founder requests received</div>
        <div className="hdc-chip b">Finance · Design · Sales</div>
      </div>

      <div className="hero-deco-card hdc-4">
        <div className="hdc-badge p">📚 Learn – Coming September</div>
        <div className="hdc-val p">Mr. Zell's class · 24 students</div>
        <div className="hdc-text">Daily Bellringer live now</div>
      </div>

      {/* Main headline */}
      <div style={{ marginBottom: '10px', fontSize: '13px', letterSpacing: '2.4px', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        For teen founders, ages 13–18
      </div>
      <h1 className="hero-h1">
        Prove you're the<br /><em>best teen founder.</em>
      </h1>

      {/* Subtitle */}
      <p className="hero-sub">
        Daily challenges, weekly duels, live 1v1s. Build your ELO. Climb the leaderboard.
      </p>

      {/* CTA buttons - UPDATED TO USE LINK */}
      <div className="hero-actions">
        <Link 
          href="/login?mode=signup" 
          className="btn-cta-primary" 
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Play a live duel
        </Link>
        <Link 
          href="/leaderboard" 
          className="btn-cta-ghost" 
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          See the leaderboard
        </Link>
      </div>

      {/* Pillar cards */}
      <div className="pillar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>

        <div className="pillar-row" style={{ display: 'flex', justifyContent: 'center', gap: '0px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* COMPETE pillar card */}
          <div className="pc compete" onClick={() => onScrollTo('compete')} style={{ flex: 1, minWidth: '360px', maxWidth: '400px' }}>
            <div className="pc-top">
              <span className="pc-icon">⚔️</span>
              <span className="pc-label compete">Compete</span>
            </div>
            <div className="pc-title">Daily Duels &amp; Live 1v1s</div>
            <p className="pc-desc" style={{ maxWidth: '280px', margin: '0 auto 12px' }}>
              Compete daily, climb the ELO leaderboard, and prove you're the best teen founder.
            </p>
            <button
              className="pc-cta compete"
              onClick={(e) => { e.stopPropagation(); onScrollTo('platform') }}
            >
              Explore more →
            </button>
            <div className="pc-preview" style={{ margin: '0 -16px', display: 'flex', justifyContent: 'center' }}>
              <div className="pc-lb" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <div className="pc-lb-title">
                  Weekly Leaderboard
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

          {/* CREATE pillar card */}
          <div className="pc create" onClick={() => onScrollTo('connect')} style={{ flex: 1, minWidth: '360px', maxWidth: '400px', borderTop: '3px solid var(--blue)' }}>
            <div className="pc-top">
              <span className="pc-icon">💡</span>
              <span className="pc-label create">Create</span>
            </div>
            <div className="pc-title">Share Ideas &amp; Find Co-Founders</div>
            <p className="pc-desc" style={{ maxWidth: '280px', margin: '0 auto 12px' }}>
              Post your startup idea, get real feedback, and find someone to build it with.
            </p>
            <button
              className="pc-cta connect"
              onClick={(e) => { e.stopPropagation(); onScrollTo('platform') }}
            >
              Explore more →
            </button>
            <div className="pc-preview" style={{ margin: '0 -16px', display: 'flex', justifyContent: 'center' }}>
              <div className="pc-cf" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <div className="pc-cf-title">Co-Founder Match</div>
                <div className="pc-cf-card">
                  <div className="pc-cf-top">
                    <div className="pc-cf-av">M</div>
                    <div className="pc-cf-name">Marcus T.</div>
                  </div>
                  <div className="pc-cf-bio">Looking for a developer to create mobile apps.</div>
                  <div className="pc-cf-skills">
                    <div className="pc-cf-skill">Finance</div>
                    <div className="pc-cf-skill">Design</div>
                    <div className="pc-cf-skill">Sales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

                  </div>
      </div>
    </section>
  )
}