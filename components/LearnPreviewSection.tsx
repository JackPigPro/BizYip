'use client'

import TeacherEmailForm from './TeacherEmailForm'
import { useAppState } from './AppStateProvider'

export default function LearnPreviewSection() {
  const { highlightLearn } = useAppState()
  
  return (
    <div 
      id="learn" 
      className={`feature-section fs-learn ${highlightLearn ? 'highlight-learn' : ''}`}
      style={{
        transition: 'all 0.3s ease',
        ...(highlightLearn && {
          animation: 'pulse-glow 2s ease-in-out',
          border: '2px solid var(--gold)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
        })
      }}
    >
      <div className="fs-label b">🎓 Learn</div>

      {/* Text side */}
      <div className="feature-text">
        <div className="ft-label b" style={{ fontSize: '18px', marginBottom: '12px', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>FOR EDUCATORS</span>
          <span style={{ color: 'var(--text3)' }}>•</span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Coming September</span>
        </div>
        <h2 className="ft-h2" style={{ fontSize: '64px', lineHeight: 1.1, marginBottom: '24px', fontWeight: 800 }}>
          <span style={{ color: 'white' }}>BizYip</span>{' '}
          <span style={{ color: 'var(--gold)' }}>for Schools</span>
        </h2>
        <p className="ft-desc" style={{ fontSize: '20px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '90%' }}>
          Daily bellringers, class leaderboards, and head-to-head duels. 
          The ideal platform to integrate into your entrepreneurship curriculum.
        </p>
        
        {/* Email form */}
        <div style={{ marginBottom: '40px' }}>
          <TeacherEmailForm />
        </div>
      </div>

      {/* Feature panels side */}
      <div className="feature-visual v-b">
        <div className="feature-panels-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '100%'
        }}>
          {/* Create Classrooms */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏫</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              Create Classrooms
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Set up virtual classrooms for your entrepreneurship courses
            </p>
          </div>
          
          {/* Schedule Lessons */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              Schedule Lessons
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Plan and assign daily bellringers and activities
            </p>
          </div>
          
          {/* Class Leaderboards */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              Class Leaderboards
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Foster friendly competition and track student progress
            </p>
          </div>
          
          {/* School Leaderboards */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎓</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              School Leaderboards
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Compare performance across different classes and schools
            </p>
          </div>
          
          {/* Teacher Dashboard */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              Teacher Dashboard
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Monitor student engagement and performance metrics
            </p>
          </div>
          
          {/* Custom Challenges */}
          <div className="feature-panel" style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              margin: '0 0 8px'
            }}>
              Custom Challenges
            </h4>
            <p style={{
              fontSize: '14px',
              color: 'var(--text2)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Create tailored challenges for your specific curriculum
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
