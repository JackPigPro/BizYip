'use client'

import Link from 'next/link'

export default function ThreePillarSection() {
  const platforms = [
    { 
      name: 'Compete', 
      icon: '⚔️',
      tagline: 'Prove Your Skills',
      description: 'Battle in real-time competitions and climb the ELO leaderboard',
      features: [
        { title: 'Live 1v1 Duels', desc: 'Get matched, answer in 30 seconds, judged live by the community' },
        { title: 'Daily Bellringers', desc: 'A new global prompt every day. Build your streak. Earn ELO.' },
        { title: 'Weekly Duels', desc: 'Submit Monday–Saturday. Community votes anonymously on Sunday. ELO drops Sunday night.' }
      ],
      stats: {},
      color: 'rgba(21, 128, 61, 0.7)',
      gradient: 'linear-gradient(135deg, rgba(21, 128, 61, 0.7), rgba(34, 197, 94, 0.7))',
      cta: 'Start Competing',
      ctaLink: '/login?mode=signup',
      visual: '🏆'
    },
    { 
      name: 'Create', 
      icon: '💡',
      tagline: 'Build Your Vision',
      description: 'Share ideas and find co-founders to build with',
      features: [
        { title: 'Idea Board', desc: 'Post ideas publicly or privately. Get real comments from the community.' },
        { title: 'Feedback with Comments', desc: 'Give and receive constructive feedback through threaded comments on ideas.' }
      ],
      stats: {},
      color: 'rgba(37, 99, 235, 0.7)',
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.7), rgba(59, 130, 246, 0.7))',
      cta: 'Post your idea',
      ctaLink: '/login?mode=signup',
      visual: '🚀'
    },
    { 
      name: 'Connect', 
      icon: '👋',
      tagline: 'Join The Community',
      description: 'Browse profiles, signal you\'re building, and find your people.',
      features: [
        { title: 'Profile Discovery', desc: 'Browse teen founders by skills, stage, and what they\'re building.' },
        { title: 'Co-Founder Matching', desc: 'Find your co-founder by skills, project stage, and what they\'re building.' },
        { title: 'Social Links', desc: 'Connect externally via X, Discord, or LinkedIn. No internal DMs.' }
      ],
      stats: {},
      color: 'rgba(168, 85, 247, 0.7)',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.7), rgba(124, 58, 237, 0.7))',
      cta: 'Find co-founders',
      ctaLink: '/login?mode=signup',
      visual: '🌟'
    }
  ]

  return (
    <div className="platform-bar">
      <div className="fs-label b" style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--gold)' }}>🚀 Platform</div>
      <div className="platform-container">
        {platforms.map((platform, index) => (
          <div 
            key={platform.name}
            className="platform-item"
            style={{ 
              background: platform.gradient,
              borderLeft: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <div className="platform-name">{platform.name}</div>
            <div className="platform-description">{platform.description}</div>
            
            <div className="platform-visual">
              <div className="visual-icon">{platform.visual}</div>
              {platform.stats && Object.keys(platform.stats).length > 0 && (
                <div className="platform-stats">
                  {Object.entries(platform.stats).map(([key, value], i: number) => (
                    <div key={i} className="stat-item">
                      <div className="stat-value">{String(value)}</div>
                      <div className="stat-label">{key}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="platform-features">
              {platform.features.map((feature, i) => (
                <div key={i} className="platform-feature">
                  <div className="feature-title">
                    <span className="feature-bullet">•</span>
                    {feature.title}
                  </div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              ))}
            </div>
            
            <Link 
              href={platform.ctaLink}
              className="platform-cta"
              style={{ 
                background: 'linear-gradient(135deg, #16a34a, #22c55e)', 
                border: 'none', 
                color: '#fff',
                padding: '10px 26px', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '700',
                cursor: 'pointer', 
                fontFamily: 'var(--font-display)', 
                transition: 'all .15s',
                boxShadow: '0 2px 10px rgba(21,128,61,.3)', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                letterSpacing: '-.1px'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement
                target.style.outline = '2px solid var(--green)'
                target.style.outlineOffset = '2px'
                target.style.fontWeight = '800'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement
                target.style.outline = 'none'
                target.style.fontWeight = '700'
              }}
            >
              {platform.cta} →
            </Link>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .platform-bar {
          width: 100%;
          background: linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 100%);
          position: relative;
          overflow: hidden;
        }
        
        .platform-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        
        .platform-container {
          width: 100%;
          display: flex;
          height: 786px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          z-index: 1;
        }
        
        .platform-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }
        
        .platform-item:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
        }
        
        .platform-icon {
          font-size: 36px;
          margin-bottom: 8px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        
        .platform-name {
          font-size: 32px;
          font-weight: 900;
          color: white;
          text-shadow: 0 3px 6px rgba(0,0,0,0.4);
          margin-top: 32px;
          margin-bottom: 8px;
          font-family: var(--font-display);
          letter-spacing: 1px;
          text-transform: uppercase;
          line-height: 1.1;
        }
        
        .platform-tagline {
          font-size: 16px;
          font-weight: 800;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          margin-bottom: 16px;
          font-family: var(--font-display);
          text-transform: uppercase;
          letter-spacing: 2px;
          position: relative;
          display: inline-block;
        }
        
        .platform-tagline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 1px;
        }
        
        .platform-description {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          margin-bottom: 24px;
          line-height: 1.5;
          font-family: var(--font-body);
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .platform-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        
        .platform-visual::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        }
        
        .visual-icon {
          font-size: 64px;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
          animation: float 3s ease-in-out infinite;
        }
        
        .platform-stats {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .stat-item {
          text-align: center;
          min-width: 60px;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 900;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          font-family: var(--font-display);
          margin-bottom: 4px;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .platform-features {
          margin-bottom: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .platform-feature {
          margin: 8px 0;
          text-align: left;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        
        .platform-feature:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }
        
        .feature-title {
          font-size: 14px;
          font-weight: 800;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
        }
        
        .feature-desc {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          margin-left: 20px;
          line-height: 1.4;
        }
        
        .feature-bullet {
          font-weight: 900;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        
        .platform-cta {
          background: #000000 !important;
          color: #ffffff !important;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          text-align: center;
          border: 2px solid #000000 !important;
          transition: all 0.3s ease;
          font-family: var(--font-display);
          letter-spacing: 1px;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
        }
        
        .platform-cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .platform-cta:hover::before {
          left: 100%;
        }
        
        .platform-cta:hover {
          background: #111111;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          border-color: #111111;
        }
        
        @media (max-width: 768px) {
          .platform-container {
            height: 899px;
          }
          
          .platform-item {
            padding: 16px 12px;
          }
          
          .platform-icon {
            font-size: 32px;
          }
          
          .platform-name {
            font-size: 20px;
          }
          
          .platform-tagline {
            font-size: 12px;
          }
          
          .platform-description {
            font-size: 11px;
          }
          
          .visual-icon {
            font-size: 40px;
          }
          
          .stat-value {
            font-size: 14px;
          }
          
          .stat-label {
            font-size: 9px;
          }
          
          .feature-title {
            font-size: 11px;
          }
          
          .feature-desc {
            font-size: 9px;
          }
          
          .platform-cta {
            font-size: 12px;
            padding: 8px 16px;
          }
        }
        
        @media (max-width: 480px) {
          .platform-container {
            height: 973px;
          }
          
          .platform-item {
            padding: 12px 8px;
          }
          
          .platform-icon {
            font-size: 28px;
          }
          
          .platform-name {
            font-size: 18px;
          }
          
          .platform-tagline {
            font-size: 11px;
          }
          
          .platform-description {
            font-size: 10px;
          }
          
          .visual-icon {
            font-size: 36px;
          }
          
          .stat-value {
            font-size: 12px;
          }
          
          .stat-label {
            font-size: 8px;
          }
          
          .feature-title {
            font-size: 10px;
          }
          
          .feature-desc {
            font-size: 8px;
          }
          
          .platform-cta {
            font-size: 11px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  )
}
