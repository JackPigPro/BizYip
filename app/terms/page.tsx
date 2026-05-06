'use client'

import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <>
      <main className="content-page">
        <div className="content-container">
          <div className="content-header">
            <h1 className="content-title">Terms of Service</h1>
            <p className="content-subtitle">Welcome to BizYip. By creating an account or using our platform, you agree to these Terms of Service.</p>
          </div>
          
          <div className="legal-content">
            <p className="legal-meta">Last updated: April 1, 2026</p>

            <div className="legal-section">
              <h3>1. Who We Are</h3>
              <p>
                BizYip is operated by Jack Segal, based in Raleigh, North Carolina. We provide a platform for aspiring founders and entrepreneurs to connect, compete, and learn.
              </p>
            </div>

            <div className="legal-section">
              <h3>2. Eligibility</h3>
              <p>
                You must be at least 13 years old to use BizYip. By creating an account, you confirm that you meet this requirement. If you are under 18, you represent that you have permission from a parent or guardian to use our platform.
              </p>
            </div>

            <div className="legal-section">
              <h3>3. Your Account</h3>
              <p>
                You are responsible for maintaining the security of your account and password. You are responsible for all activity that occurs under your account. You agree to provide accurate information when creating your account, including a username that does not impersonate another person. We reserve the right to terminate accounts that violate these terms.
              </p>
            </div>

            <div className="legal-section">
              <h3>4. User Content</h3>
              <p>
                BizYip allows you to post ideas, submissions, and other content. You retain ownership of the content you post. By posting content on BizYip, you grant us a non-exclusive, royalty-free license to display and distribute that content on our platform.
              </p>
              <p>
                You agree not to post content that is illegal, harmful, harassing, defamatory, or violates the rights of others. We reserve the right to remove any content that violates these terms.
              </p>
            </div>

            <div className="legal-section">
              <h3>5. The Weekly Duel</h3>
              <p>
                BizYip hosts weekly competition events called Weekly Duels. ELO points awarded through Weekly Duels have no monetary value and cannot be exchanged for cash or prizes.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue the Weekly Duel feature at any time. We reserve the right to disqualify submissions that violate our community guidelines.
              </p>
            </div>

            <div className="legal-section">
              <h3>6. Prohibited Conduct</h3>
              <p>You agree not to use BizYip to:</p>
              <ul>
                <li>Harass, bully, or harm other users</li>
                <li>Post spam, fake information, or misleading content</li>
                <li>Attempt to gain unauthorized access to any part of the platform</li>
                <li>Use automated tools or bots to interact with the platform</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>7. Intellectual Property</h3>
              <p>
                BizYip and its original content, features, and functionality are owned by Jack Segal and are protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of our platform without written permission.
              </p>
            </div>

            <div className="legal-section">
              <h3>8. Disclaimers</h3>
              <p>
                BizYip is provided on an "as is" basis. We make no warranties about reliability, availability, or accuracy of platform. We are not responsible for any loss or damage resulting from your use of BizYip.
              </p>
            </div>

            <div className="legal-section">
              <h3>9. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, Jack Segal shall not be liable for any indirect, incidental, or consequential damages arising from your use of BizYip.
              </p>
            </div>

            <div className="legal-section">
              <h3>10. Changes to These Terms</h3>
              <p>
                We may update these Terms of Service from time to time. We will notify users of significant changes by posting a notice on the platform. Continued use of BizYip after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div className="legal-section">
              <h3>11. Governing Law</h3>
              <p>
                These Terms of Service are governed by the laws of the State of North Carolina, without regard to its conflict of law provisions.
              </p>
            </div>

            <div className="legal-section">
              <h3>12. Contact</h3>
              <p>
                If you have questions about these Terms of Service, contact us at <a href="mailto:jackpigpro@gmail.com" className="contact-email">jackpigpro@gmail.com</a>.
              </p>
            </div>
          </div>

          <div className="legal-footer">
            <p>BizYip • Raleigh, North Carolina</p>
          </div>
        </div>
      </main>
      <Footer onScrollTo={(id) => {}} />
    </>
  )
}
