'use client'

import Link from 'next/link'

export default function ThreePillarSection() {
  return (
    <div id="pillars" className="feature-section fs-pillars" style={{
      backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '40px 0',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      display: 'block',
      borderBottom: 'none',
      minHeight: 'auto'
    }}>
      <div className="fs-label b" style={{ paddingLeft: '24px', paddingRight: '24px' }}>🚀 Platform</div>

      {/* Three equal width columns - no left text */}
      <div className="pillar-row" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '0px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingLeft: '80px',
        paddingRight: '80px'
      }}>
        
        {/* COMPETE pillar card */}
        <div className="pc compete" style={{ 
          flex: 1, 
          minWidth: '360px', 
          maxWidth: '400px',
          background: 'rgba(21, 128, 61, 0.1)'
        }}>
          <div className="pc-top">
            <span className="pc-icon">⚔️</span>
            <span className="pc-label compete">Compete</span>
          </div>
          <div className="pc-title">Live 1v1 &amp; Daily Bellringers</div>
          <p className="pc-desc" style={{ maxWidth: '280px', margin: '0 auto 12px' }}>
            Battle in real-time competitions and submit answers to daily challenges to climb the ELO leaderboard.
          </p>
          <Link href="/login?mode=signup" className="pc-cta compete" style={{ textDecoration: 'none' }}>
            Start Competing →
          </Link>
        </div>

        {/* CREATE pillar card */}
        <div className="pc create" style={{ 
          flex: 1, 
          minWidth: '360px', 
          maxWidth: '400px',
          background: 'rgba(37, 99, 235, 0.1)'
        }}>
          <div className="pc-top">
            <span className="pc-icon">💡</span>
            <span className="pc-label create">Create</span>
          </div>
          <div className="pc-title">Share Ideas &amp; Find Co-Founders</div>
          <p className="pc-desc" style={{ maxWidth: '280px', margin: '0 auto 12px' }}>
            Post your startup idea, get real feedback from other builders, and find someone to build it with.
          </p>
          <Link href="/login?mode=signup" className="pc-cta connect" style={{ textDecoration: 'none' }}>
            Share Ideas →
          </Link>
        </div>

        {/* CONNECT pillar card */}
        <div className="pc connect" style={{ 
          flex: 1, 
          minWidth: '360px', 
          maxWidth: '400px',
          background: 'rgba(168, 85, 247, 0.1)'
        }}>
          <div className="pc-top">
            <span className="pc-icon">👋</span>
            <span className="pc-label connect">Connect</span>
          </div>
          <div className="pc-title">Join Community &amp; Network</div>
          <p className="pc-desc" style={{ maxWidth: '280px', margin: '0 auto 12px' }}>
            Join thousands of teen founders, find mentors, and build your network in the startup community.
          </p>
          <Link href="/login?mode=signup" className="pc-cta connect" style={{ textDecoration: 'none' }}>
            Join Community →
          </Link>
        </div>
      </div>
    </div>
  )
}
