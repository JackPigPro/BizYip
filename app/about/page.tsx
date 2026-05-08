'use client'

import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <main className="content-page">
        <div className="content-container">
          <div className="content-header">
            <h1 className="content-title">About BizYip</h1>
            <p className="content-subtitle">Where founders get good.</p>
          </div>
          
          <div className="content-section">
            <div className="story-card">
              <h2 className="section-title">The Story</h2>
              <div className="story-content">
                <p className="story-paragraph">
                  It started in piano class. A group of DECA kids were presenting business pitches and I watched from the back thinking — I could make a better logo than that.
                </p>
                <p className="story-paragraph">
                  So when my teacher gave us a business prompt and 10 minutes, I opened Canva and competed. The teacher judged. I was hooked.
                </p>
                <p className="story-paragraph">
                  Nobody had built the daily version of that feeling. I used to wake up at 3am to grind vocabulary.com leaderboards with a friend. Not because anyone told us to. Not for a grade. Just because the competition was addictive and we wanted to win.
                </p>
                <p className="story-paragraph highlight">
                  That's the feeling I'm trying to create — but for entrepreneurial skills.
                </p>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="vision-card">
              <h2 className="section-title">The Vision</h2>
              <div className="vision-content">
                <p className="vision-paragraph">
                  In mid 2025, as a junior in high school, I wanted to build a place where high schoolers could find each other, share ideas, and actually collaborate on building something.
                </p>
                <p className="vision-paragraph">
                  Then in March 2026 I combined both ideas into one.
                </p>
                <div className="mission-statement">
                  <p className="mission-text">
                    BizYip is where you compete to sharpen your thinking, connect with other founders your age, and join the daily bellringer to build something real. All in one place. All for free.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3 className="value-title">Compete</h3>
                <p className="value-description">
                  Sharpen your thinking through daily competitions and weekly duels that test your entrepreneurial skills.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">👋</div>
                <h3 className="value-title">Connect</h3>
                <p className="value-description">
                  Find other founders your age who share your passion and complementary skills.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">�</div>
                <h3 className="value-title">Daily Bellringer</h3>
                <p className="value-description">
                  Join daily challenges and build streaks while developing real-world skills.
                </p>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="founder-card">
              <h2 className="section-title">Founder</h2>
              <div className="founder-info">
                <div className="founder-avatar">JS</div>
                <div className="founder-details">
                  <h3 className="founder-name">Jack Segal</h3>
                  <p className="founder-location">Raleigh, North Carolina</p>
                  <p className="founder-bio">
                    High school junior turned founder, building the platform I wish existed when I started my entrepreneurial journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer onScrollTo={(id) => {}} />
    </>
  )
}
