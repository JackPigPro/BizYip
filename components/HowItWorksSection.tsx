'use client'

import { useState } from 'react'

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div id="how-it-works" className="feature-section fs-how" style={{
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '40px 0',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      display: 'block', // Override the grid layout
      borderBottom: 'none', // Remove the default border
      minHeight: 'auto' // Override the min-height
    }}>
      <div className="fs-label b" style={{ paddingLeft: '24px', paddingRight: '24px' }}>⚡ How It Works</div>

      {/* Horizontal step boxes */}
      <div className="steps-horizontal" style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        margin: '20px 0 0',
        gap: '80px',
        paddingLeft: '80px',
        paddingRight: '80px'
      }}>
        {/* Sign Up Box */}
        <div
          className="step-box"
          style={{
            flex: '0 0 312px',
            background: activeStep === 1 ? 'rgba(34, 197, 94, 0.7)' : 'var(--card)',
            border: activeStep === 1 ? '2px solid rgba(34, 197, 94, 1)' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '50px 25px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: activeStep === 1 ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: activeStep === 1 ? '0 8px 24px rgba(0,0,0,0.15)' : 'var(--shadow)',
            position: 'relative',
            margin: '20px 0'
          }}
          onMouseEnter={() => setActiveStep(1)}
          onMouseLeave={() => setActiveStep(null)}
        >
          <div 
            className="step-number"
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '39px',
              height: '39px',
              borderRadius: '50%',
              background: activeStep === 1 ? 'white' : 'rgba(34, 197, 94, 0.7)',
              color: activeStep === 1 ? 'rgba(34, 197, 94, 1)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              fontFamily: 'var(--font-display)',
              border: activeStep === 1 ? '2px solid white' : 'none',
              zIndex: 2
            }}
          >
            1
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: activeStep === 1 ? 'white' : 'var(--text)',
            margin: '0 0 16px',
            letterSpacing: '-0.5px'
          }}>
            Sign Up
          </h3>

          <p style={{
            fontSize: '16px',
            color: activeStep === 1 ? 'rgba(255,255,255,0.9)' : 'var(--text2)',
            lineHeight: 1.4,
            margin: '0 0 24px'
          }}>
            Free account, 30 seconds
          </p>

          <div 
            className="step-visual"
            style={{
              display: 'flex',
              justifyContent: 'center',
              transform: activeStep === 1 ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            <button
              onClick={() => window.location.href = '/login?mode=signup'}
              style={{
                background: activeStep === 1 ? 'white' : 'rgba(34, 197, 94, 0.7)',
                color: activeStep === 1 ? 'rgba(34, 197, 94, 1)' : 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                border: activeStep === 1 ? '2px solid rgba(34, 197, 94, 1)' : '2px solid rgba(34, 197, 94, 0.7)',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = 'rgba(34, 197, 94, 1)';
                target.style.color = 'white';
                target.style.borderColor = 'rgba(34, 197, 94, 1)';
                target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = activeStep === 1 ? 'white' : 'rgba(34, 197, 94, 0.7)';
                target.style.color = activeStep === 1 ? 'rgba(34, 197, 94, 1)' : 'white';
                target.style.borderColor = activeStep === 1 ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 0.7)';
                target.style.transform = 'translateY(0)';
              }}
            >
              Sign Up Free
            </button>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '-60px',
            transform: 'translateY(-50%)',
            color: 'white',
            fontSize: '48px',
            fontWeight: 900,
            zIndex: 1,
            textShadow: '0 5px 10px rgba(0,0,0,0.7)',
            letterSpacing: '-5px',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
          }}>
            →
          </div>
        </div>

        {/* Compete Box */}
        <div
          className="step-box"
          style={{
            flex: '0 0 338px',
            background: activeStep === 2 ? 'rgba(59, 130, 246, 0.7)' : 'var(--card)',
            border: activeStep === 2 ? '2px solid rgba(59, 130, 246, 1)' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '55px 30px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: activeStep === 2 ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: activeStep === 2 ? '0 8px 24px rgba(0,0,0,0.15)' : 'var(--shadow)',
            position: 'relative',
            margin: '20px 0'
          }}
          onMouseEnter={() => setActiveStep(2)}
          onMouseLeave={() => setActiveStep(null)}
        >
          <div 
            className="step-number"
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '39px',
              height: '39px',
              borderRadius: '50%',
              background: activeStep === 2 ? 'white' : 'rgba(59, 130, 246, 0.7)',
              color: activeStep === 2 ? 'rgba(59, 130, 246, 1)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              fontFamily: 'var(--font-display)',
              border: activeStep === 2 ? '2px solid white' : 'none',
              zIndex: 2
            }}
          >
            2
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: activeStep === 2 ? 'white' : 'var(--text)',
            margin: '0 0 16px',
            letterSpacing: '-0.5px'
          }}>
            Compete
          </h3>

          <p style={{
            fontSize: '16px',
            color: activeStep === 2 ? 'rgba(255,255,255,0.9)' : 'var(--text2)',
            lineHeight: 1.4,
            margin: '0 0 24px'
          }}>
            Live 1v1 battles & bellringers
          </p>

          <div 
            className="step-visual"
            style={{
              display: 'flex',
              justifyContent: 'center',
              transform: activeStep === 2 ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              width: '200px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--blue)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '1px'
              }}>
                BATTLE ARENA
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--green)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    margin: '0 auto 4px'
                  }}>
                    D
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--green)'
                  }}>
                    DesignWolf
                  </div>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-display)'
                }}>
                  VS
                </div>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    margin: '0 auto 4px'
                  }}>
                    N
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--red)'
                  }}>
                    NeonBrush
                  </div>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(90deg, var(--green), var(--blue))',
                height: '4px',
                borderRadius: '2px',
                marginBottom: '8px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '60%',
                  top: '-2px',
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  border: '2px solid var(--green)',
                  borderRadius: '50%'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: 'var(--text2)',
                marginBottom: '6px'
              }}>
                <span>⏱️ 2:34</span>
                <span>🏆 +5 ELO</span>
              </div>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                padding: '6px',
                fontSize: '9px',
                fontWeight: 700,
                color: 'var(--blue)',
                textAlign: 'center',
                fontFamily: 'var(--font-display)'
              }}>
                ROUND 3 OF 5
              </div>
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '-60px',
            transform: 'translateY(-50%)',
            color: 'white',
            fontSize: '48px',
            fontWeight: 900,
            zIndex: 1,
            textShadow: '0 5px 10px rgba(0,0,0,0.7)',
            letterSpacing: '-5px',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
          }}>
            →
          </div>
        </div>

        {/* Get Judged Box */}
        <div
          className="step-box"
          style={{
            flex: '0 0 364px',
            background: activeStep === 3 ? 'rgba(249, 115, 22, 0.7)' : 'var(--card)',
            border: activeStep === 3 ? '2px solid rgba(249, 115, 22, 1)' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '85px 35px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: activeStep === 3 ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: activeStep === 3 ? '0 8px 24px rgba(0,0,0,0.15)' : 'var(--shadow)',
            position: 'relative',
            margin: '20px 0'
          }}
          onMouseEnter={() => setActiveStep(3)}
          onMouseLeave={() => setActiveStep(null)}
        >
          <div 
            className="step-number"
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '39px',
              height: '39px',
              borderRadius: '50%',
              background: activeStep === 3 ? 'white' : 'rgba(249, 115, 22, 0.7)',
              color: activeStep === 3 ? 'rgba(249, 115, 22, 1)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              fontFamily: 'var(--font-display)',
              border: activeStep === 3 ? '2px solid white' : 'none',
              zIndex: 2
            }}
          >
            3
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: activeStep === 3 ? 'white' : 'var(--text)',
            margin: '0 0 16px',
            letterSpacing: '-0.5px'
          }}>
            Get Judged
          </h3>

          <p style={{
            fontSize: '16px',
            color: activeStep === 3 ? 'rgba(255,255,255,0.9)' : 'var(--text2)',
            lineHeight: 1.4,
            margin: '0 0 24px'
          }}>
            Community scoring & feedback
          </p>

          <div 
            className="step-visual"
            style={{
              display: 'flex',
              justifyContent: 'center',
              transform: activeStep === 3 ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              width: '180px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--orange)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '1px'
              }}>
                COMMUNITY JUDGED
              </div>
              <div style={{
                background: 'var(--orange)',
                color: 'white',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '10px',
                fontStyle: 'italic'
              }}>
                "AI-powered study tools"
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '8px',
                gap: '2px'
              }}>
                {[1,2,3,4,5].map((star) => (
                  <span key={star} style={{ 
                    fontSize: '16px', 
                    color: star <= 4 ? 'var(--gold)' : 'rgba(255, 215, 0, 0.3)'
                  }}>⭐</span>
                ))}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: 'var(--text2)',
                marginBottom: '8px'
              }}>
                <span>4.8 avg • 24 reviews</span>
                <span style={{ color: 'var(--orange)' }}>⚡ 2h ago</span>
              </div>
              <div style={{
                display: 'flex',
                gap: '4px',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '4px',
                  padding: '3px 6px',
                  fontSize: '8px',
                  fontWeight: 600,
                  color: 'var(--orange)'
                }}>
                  APPROVED
                </div>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '4px',
                  padding: '3px 6px',
                  fontSize: '8px',
                  fontWeight: 600,
                  color: 'var(--green)'
                }}>
                  FEATURED
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '-60px',
            transform: 'translateY(-50%)',
            color: 'white',
            fontSize: '48px',
            fontWeight: 900,
            zIndex: 1,
            textShadow: '0 5px 10px rgba(0,0,0,0.7)',
            letterSpacing: '-5px',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
          }}>
            →
          </div>
        </div>

        {/* Climb Box */}
        <div
          className="step-box"
          style={{
            flex: '0 0 390px',
            background: activeStep === 4 ? 'rgba(234, 179, 8, 0.7)' : 'var(--card)',
            border: activeStep === 4 ? '2px solid rgba(234, 179, 8, 1)' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '120px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: activeStep === 4 ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: activeStep === 4 ? '0 8px 24px rgba(0,0,0,0.15)' : 'var(--shadow)',
            position: 'relative',
            margin: '20px 0'
          }}
          onMouseEnter={() => setActiveStep(4)}
          onMouseLeave={() => setActiveStep(null)}
        >
          <div 
            className="step-number"
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '39px',
              height: '39px',
              borderRadius: '50%',
              background: activeStep === 4 ? 'white' : 'rgba(234, 179, 8, 0.7)',
              color: activeStep === 4 ? 'rgba(234, 179, 8, 1)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              fontFamily: 'var(--font-display)',
              border: activeStep === 4 ? '2px solid white' : 'none',
              zIndex: 2
            }}
          >
            4
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: activeStep === 4 ? 'white' : 'var(--text)',
            margin: '0 0 16px',
            letterSpacing: '-0.5px'
          }}>
            Climb
          </h3>

          <p style={{
            fontSize: '16px',
            color: activeStep === 4 ? 'rgba(255,255,255,0.9)' : 'var(--text2)',
            lineHeight: 1.4,
            margin: '0 0 24px'
          }}>
            ELO & leaderboard rankings
          </p>

          <div 
            className="step-visual"
            style={{
              display: 'flex',
              justifyContent: 'center',
              transform: activeStep === 4 ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="pc-lb" style={{ transform: 'scale(1.2)', transformOrigin: 'top center' }}>
                <div className="pc-lb-title" style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-display)'
                }}>
                  Weekly Leaderboard
                </div>
                <div className="pc-lb-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="pc-lb-rank" style={{ fontSize: '14px' }}>🥇</div>
                  <div className="pc-lb-av" style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--green)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>D</div>
                  <div className="pc-lb-name" style={{ fontSize: '12px', fontWeight: 700 }}>DesignWolf</div>
                  <div className="pc-lb-elo" style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>1,891</div>
                  <div className="pc-lb-delta" style={{ fontSize: '10px', color: 'var(--green)' }}>↑3</div>
                </div>
                <div className="pc-lb-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="pc-lb-rank" style={{ fontSize: '14px' }}>🥈</div>
                  <div className="pc-lb-av" style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>N</div>
                  <div className="pc-lb-name" style={{ fontSize: '12px', fontWeight: 700 }}>NeonBrush</div>
                  <div className="pc-lb-elo" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 700 }}>1,756</div>
                  <div className="pc-lb-delta" style={{ fontSize: '10px', color: 'var(--green)' }}>↑1</div>
                </div>
                <div className="pc-lb-row you-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="pc-lb-rank" style={{ color: 'var(--green)', fontSize: '10px', fontWeight: 700 }}>#47</div>
                  <div className="pc-lb-av" style={{ 
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--green-mid)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>J</div>
                  <div className="pc-lb-name" style={{ color: 'var(--green)', fontWeight: 700, fontSize: '12px' }}>you</div>
                  <div className="pc-lb-elo" style={{ fontSize: '12px', fontWeight: 700 }}>1,240</div>
                  <div className="pc-lb-delta" style={{ fontSize: '10px', color: 'var(--green)' }}>↑4</div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
