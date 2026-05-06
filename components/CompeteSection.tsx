'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CompeteSection() {
  const [seconds, setSeconds] = useState(47)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 0) return 180 // reset to 3:00 when it hits 0
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`

  return (
    <div id="compete" className="feature-section fs-compete reverse">
      <div className="fs-label g">⚔️ Compete</div>

      {/* Text side */}
      <div className="feature-text">
        <div className="ft-label g">⚔️ Compete</div>
        <h2 className="ft-h2">Daily Duels &amp; Weekly Competitions.<br />Build your rank.</h2>
        <p className="ft-desc">
          Daily head-to-head battles and weekly tournaments. Climb the ELO ladder with 8 rank tiers from Trainee to Unicorn.
        </p>
        <div className="ft-bullets">
          <div className="ft-b">
            <div className="ft-b-dot g"></div>
            <span>Daily Duels — quick head-to-head competitions to sharpen your skills</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot g"></div>
            <span>Weekly Tournaments — themed challenges with community voting</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot g"></div>
            <span>ELO rating system with 8 rank tiers from Trainee to Unicorn</span>
          </div>
          <div className="ft-b">
            <div className="ft-b-dot g"></div>
            <span>Anonymous judging — nobody knows whose work they&apos;re rating</span>
          </div>
        </div>
        <Link href="/login?mode=signup" className="ft-cta g" style={{ textDecoration: 'none' }}>⚡ Start Competing</Link>
      </div>

      {/* Interactive visual side */}
      <div className="feature-visual v-g">
        <div className="match-arena">
          {/* Match header with live timer */}
          <div className="ma-header">
            <div className="ma-mode">⚡ Daily Duel</div>
            <div className="ma-timer-wrap">
              <div style={{ textAlign: 'right' }}>
                <div className="ma-timer">2:45</div>
                <div className="ma-timer-label">remaining</div>
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="ma-prompt-card">
            <div className="ma-prompt-label">Today&apos;s Duel Prompt</div>
            <div className="ma-prompt-text">
              &ldquo;Design a landing page for an AI-powered study assistant.&rdquo;
            </div>
          </div>

          <div className="ma-player-card you">
            <div className="ma-player-top">
              <div className="ma-av you">J</div>
              <div>
                <div className="ma-pname">your duel submission</div>
                <div className="ma-pelo">Draft open · closes in 3 hours</div>
              </div>
            </div>
            <div className="ma-canvas">Write and submit your entry</div>
          </div>

          {/* Submit button */}
          <button className="ma-submit">Submit Duel Entry →</button>

          {/* Mini leaderboard */}
          <div className="ma-lb">
            <div className="ma-lb-header">
              <div className="ma-lb-title">Daily Duel Leaderboard</div>
              <div className="ma-lb-live">
                <div className="live-dot"></div>&nbsp;128 live
              </div>
            </div>
            <div className="ma-lb-row">
              <div className="ma-lb-rank">🥇</div>
              <div className="ma-lb-av">A</div>
              <div className="ma-lb-name">AlexChen</div>
              <div className="ma-lb-elo">2,145</div>
              <div className="ma-lb-delta">↑12</div>
            </div>
            <div className="ma-lb-row">
              <div className="ma-lb-rank">🥈</div>
              <div className="ma-lb-av">S</div>
              <div className="ma-lb-name">SarahK</div>
              <div className="ma-lb-elo">1,987</div>
              <div className="ma-lb-delta">↑8</div>
            </div>
            <div className="ma-lb-row you">
              <div className="ma-lb-rank" style={{ color: 'var(--green)', fontSize: '10px' }}>#34</div>
              <div className="ma-lb-av" style={{ background: 'var(--green-mid)' }}>J</div>
              <div className="ma-lb-name" style={{ color: 'var(--green)', fontWeight: 700 }}>you</div>
              <div className="ma-lb-elo">1,456</div>
              <div className="ma-lb-delta">↑5</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
