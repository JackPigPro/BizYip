'use client'

import { useState } from 'react'
import Link from 'next/link'

const TABS = ['💡 Idea Feed', '🤝 Co-Founders'] as const

export default function ConnectSection() {
  const [activeTab, setActiveTab] = useState<string>('💡 Idea Feed')

  return (
    <div id="connect" className="feature-section fs-connect">
      <div className="fs-label b">🤝 Connect</div>

      {/* Text side */}
      <div className="feature-text">
        <div className="ft-label b">🤝 Connect</div>
        <h2 className="ft-h2">Share your idea.<br />Find your people.</h2>
        <p className="ft-desc">
          Post your startup idea, get real feedback from other builders, and find someone to build it with.
        </p>
        <div className="ft-bullets">
          <div className="ft-b">
            <div className="ft-b-dot b"></div>
            <span>Community idea board — post and get honest feedback within hours</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot b"></div>
            <span>Co-founder matching based on skills, interests, and competitive history</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot b"></div>
            <span>Your rank is visible on your profile — no more &ldquo;trust me, I&apos;m good&rdquo;</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot b"></div>
            <span>DM builders, form teams, go from idea to building partner in days</span>
          </div>
        </div>
        <Link href="/login?mode=signup" className="ft-cta b" style={{ textDecoration: 'none' }}>🤝 Start Connecting</Link>
      </div>

      {/* Interactive visual side */}
      <div className="feature-visual v-b">
        <div className="connect-board">
          <div className="demo-badge">Demo</div>
          {/* Tab bar */}
          <div className="cb-header">
            <div className="cb-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`cb-tab ${activeTab === tab ? 'active-b' : 'inactive'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="cb-new-btn">+ Post Idea</button>
          </div>

          {activeTab === '💡 Idea Feed' && (
            <>
              <div className="idea-post">
                <div className="ip-top">
                  <div className="ip-av b">S</div>
                  <div><div className="ip-name">Sarah K.</div></div>
                  <div className="ip-elo">Forum · Feedback</div>
                </div>
                <div className="ip-badge seeking">🔍 Seeking Feedback</div>
                <div className="ip-text">
                  &ldquo;ParkShare — imagine Airbnb for empty driveways. Homeowners rent spots during peak hours.
                  Testing in Phoenix first. Does this work?&rdquo;
                </div>
                <div className="ip-actions">
                  <button className="ip-action-btn">👍 24</button>
                  <button className="ip-action-btn primary">💬 Reply</button>
                  <div className="ip-count">7 replies</div>
                </div>
              </div>
              <div className="idea-post" style={{ borderLeft: '3px solid var(--blue)' }}>
                <div className="ip-name">How should first-time founders validate demand in under 72 hours?</div>
                <div className="ip-text">Share your strategies and get feedback from the community</div>
              </div>
            </>
          )}
          {activeTab === '🤝 Co-Founders' && (
            <div className="cf-match-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div className="cf-match-label">Co-founder match</div>
                </div>
                <div style={{ fontSize: '22px' }}>🤝</div>
              </div>
              <div className="cf-match-profile">
                <div className="cf-match-av">M</div>
                <div className="cf-match-info">
                  <div className="cf-match-name">Marcus T.</div>
                  <div className="cf-match-meta">Full-stack dev · 3 months building</div>
                </div>
              </div>
              <div className="cf-skills">
                <div className="cf-skill">React</div>
                <div className="cf-skill">Python</div>
                <div className="cf-skill">Fintech</div>
                <div className="cf-skill">Edtech</div>
              </div>
              <div className="cf-actions">
                <button className="cf-btn accept" style={{ transition: 'none' }}>✓ Connect</button>
                <button className="cf-btn skip">Skip</button>
              </div>
            </div>
          )}
          {activeTab === '💬 Chat' && (
            <div className="idea-post" style={{ borderLeft: '3px solid var(--green)' }}>
              <div className="ip-top">
                <div className="ip-av g">M</div>
                <div><div className="ip-name">Marcus T.</div></div>
                <div className="ip-elo">Online</div>
              </div>
              <div className="ip-text">Saw your idea in forum. Want to build together? I can hop on a quick call tonight.</div>
              <div className="ip-actions">
                <button className="ip-action-btn primary">Open Chat</button>
                <button className="ip-action-btn">View Profile</button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
