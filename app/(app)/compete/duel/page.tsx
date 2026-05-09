'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useAppState } from '../../../../components/AppStateProvider'

export default function DuelPage() {
  const { isAuthenticated, authLoading } = useUser()
  const { duelDraft } = useAppState()
  const [submitted, setSubmitted] = useState(false)
  const [entry, setEntry] = useState(duelDraft)
  const [secondsLeft, setSecondsLeft] = useState(6 * 3600 + 14 * 60) // 6h 14m

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const timeStr = `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`

  if (authLoading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: 'var(--bg)', backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)', backgroundSize: '48px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '200px', height: '48px', background: 'var(--border)', borderRadius: '8px', margin: '0 auto 24px', animation: 'pulse 2s infinite' }} />
          <div style={{ width: '300px', height: '32px', background: 'var(--border)', borderRadius: '8px', margin: '0 auto', animation: 'pulse 2s infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Arena banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0f2a1a 100%)',
        border: '1px solid rgba(34,197,94,.18)',
        borderRadius: '18px',
        padding: '36px',
        marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(34,197,94,.8)', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                ⚡ THE WEEKLY DUEL · WEEK 14
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.38)' }}>
                342 entries submitted · Closes Sunday at midnight
              </div>
            </div>
            {/* Countdown */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', marginBottom: '4px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>CLOSES IN</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#22c55e', fontFamily: 'var(--font-display)', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
                {timeStr}
              </div>
            </div>
          </div>

          {/* The Prompt */}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', padding: '24px', marginBottom: '0' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(34,197,94,.7)', fontFamily: 'var(--font-display)', marginBottom: '10px' }}>
              THIS WEEK&apos;S PROMPT
            </div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.25, letterSpacing: '-.5px', margin: 0 }}>
              &ldquo;Brand a sustainable fashion startup targeting Gen Z in a single tagline.&rdquo;
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .9fr', gap: '24px' }}>

        {/* Submission area */}
        <div>
          {!isAuthenticated ? (
            /* Sign-in banner for non-authenticated users */
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>✍️ Your Entry</span>
              </div>
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
                  Sign in to enter this week's duel
                </div>
                <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
                  Submit your tagline and compete with other founders for ELO rewards.
                </p>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'var(--green)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  Sign In to Enter
                </Link>
              </div>
            </div>
          ) : !submitted ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>✍️ Your Entry</span>
                <Link href="/connect/vault" style={{ fontSize: '12px', color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>Open Vault Draft →</Link>
              </div>
              <div style={{ padding: '22px' }}>
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Write your tagline here… Keep it sharp."
                  rows={4}
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: '9px', border: '1px solid var(--border)',
                    background: 'var(--surface)', fontSize: '15px',
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    color: 'var(--text)', outline: 'none', resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    Submissions are anonymous until judging closes.
                  </div>
                  <button
                    onClick={() => entry.trim() && setSubmitted(true)}
                    style={{
                      padding: '11px 28px', borderRadius: '9px',
                      background: entry.trim() ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'var(--surface)',
                      border: entry.trim() ? 'none' : '1px solid var(--border)',
                      color: entry.trim() ? '#fff' : 'var(--text3)',
                      fontSize: '14px', fontWeight: 700, cursor: entry.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-display)',
                      boxShadow: entry.trim() ? '0 4px 14px rgba(21,128,61,.35)' : 'none',
                      transition: 'all .2s',
                    }}
                  >
                    ⚔️ Submit Entry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--green-tint)', border: '1px solid rgba(22,163,74,.25)',
              borderRadius: '14px', padding: '32px', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>You&apos;re in the Arena.</div>
              <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px' }}>
                Your entry has been submitted anonymously. Results post when the duel closes Sunday.
              </p>
              <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', textAlign: 'left', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>YOUR ENTRY</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  &ldquo;{entry}&rdquo;
                </div>
              </div>
              <button
                onClick={() => { setSubmitted(false); setEntry('') }}
                style={{ padding: '9px 22px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
              >
                Edit Entry
              </button>
            </div>
          )}

          {/* Rules */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', marginTop: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '14px' }}>📋 How It Works</div>
            {[
              ['Submit by Sunday midnight', 'Your entry is locked in and stays anonymous.'],
              ['Community judging opens', 'Other founders rate submissions — nobody knows whose is whose.'],
              ['ELO updates Monday', 'Win = gain ELO. Lose = lose less. Everyone gets judged.'],
              ['Results & feedback posted', 'See how you ranked and why.'],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 3 ? '12px' : 0 }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--green-tint)', border: '1px solid rgba(22,163,74,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: live stats + past winners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live stats */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(34,197,94,.6)', animation: 'lpulse 1.5s infinite' }}></div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>LIVE STATS</span>
            </div>
            {[
              { label: 'Entries so far', value: '342' },
              { label: 'Prize pool', value: 'Top 1/2/3 + Top 10 rewards' },
              { label: 'Scoring model', value: 'No ELO loss this phase' },
              { label: 'Closes', value: 'Sunday 11:59 PM' },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Past duel winners */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>🏆 LAST WEEK&apos;S WINNERS</span>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Prompt: &ldquo;Name a startup that helps remote teams stay focused&rdquo;</div>
            </div>
            {[
              { rank: '🥇', name: 'DesignWolf', entry: '"Taste the Grid" — won with +31 ELO' },
              { rank: '🥈', name: 'NeonBrush',  entry: '"Logo for the algorithm" — +18 ELO' },
              { rank: '🥉', name: 'PitchQueen', entry: '"Icon or icon?" — +12 ELO' },
            ].map((w, i, arr) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>{w.rank}</span>
                  <Link href="/profile" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', textDecoration: 'none' }}>{w.name}</Link>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', fontStyle: 'italic' }}>{w.entry}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}