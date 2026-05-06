'use client'

import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <>
      <main className="content-page">
        <div className="content-container">
          <div className="content-header">
            <h1 className="content-title">Privacy Policy</h1>
            <p className="content-subtitle">This Privacy Policy explains how BizYip collects, uses, and protects your information when you use our platform.</p>
          </div>
          
          <div className="legal-content">
            <p className="legal-meta">Last updated: April 1, 2026</p>

            <div className="legal-section">
              <h3>1. Information We Collect</h3>
              <p>
                <strong>Account Information:</strong> When you create an account, we collect your email address, username, and any profile information you choose to provide such as your bio, location, skills, and social links.
              </p>
              <p>
                <strong>Platform Activity:</strong> When you use BizYip, we collect the content you post including ideas and Weekly Duel submissions, your activity on the platform including votes cast and competitions entered, and your ELO score and rank history.
              </p>
            </div>

            <div className="legal-section">
              <h3>2. How We Collect Information</h3>
              <p>
                We collect information you provide directly when you sign up or update your profile. If you sign in with Google, we receive your email address and name from Google in accordance with Google's privacy policy.
              </p>
              <p>
                We collect usage data automatically as you interact with the platform.
              </p>
            </div>

            <div className="legal-section">
              <h3>3. How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul>
                <li>Operate and improve BizYip</li>
                <li>Display your profile and content to other users</li>
                <li>Calculate and display your ELO score and leaderboard ranking</li>
                <li>Send you account-related emails such as login verification codes</li>
                <li>Respond to your questions and support requests</li>
              </ul>
              <p>
                <strong>We do not sell your personal information to third parties. We do not use your information for advertising purposes.</strong>
              </p>
            </div>

            <div className="legal-section">
              <h3>4. Information We Share</h3>
              <p>
                Your username, profile information, ideas, and Weekly Duel submissions may be visible to other users of BizYip as part of the platform's core functionality. We do not share your email address with other users.
              </p>
              <p>
                We may share your information if required by law or to protect the rights and safety of our users.
              </p>
            </div>

            <div className="legal-section">
              <h3>5. Data Storage</h3>
              <p>
                Your data is stored securely using Supabase, a third-party database provider. We take reasonable measures to protect your information but cannot guarantee absolute security.
              </p>
            </div>

            <div className="legal-section">
              <h3>6. Children's Privacy</h3>
              <p>
                BizYip is available to users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us and we will delete it promptly.
              </p>
            </div>

            <div className="legal-section">
              <h3>7. Your Rights</h3>
              <p>
                You may update or delete your profile information at any time through your account settings. You may request deletion of your account by contacting us at <a href="mailto:jackpigpro@gmail.com" className="contact-email">jackpigpro@gmail.com</a>. We will respond to account deletion requests within 30 days.
              </p>
            </div>

            <div className="legal-section">
              <h3>8. Third-Party Services</h3>
              <p>
                BizYip uses the following third-party services:
              </p>
              <ul>
                <li><strong>Supabase</strong> for database and authentication</li>
                <li><strong>Google OAuth</strong> for sign-in with Google</li>
                <li><strong>Vercel</strong> for hosting</li>
                <li><strong>Resend</strong> for transactional emails</li>
              </ul>
              <p>
                Each of these services has their own privacy policies governing their use of your data.
              </p>
            </div>

            <div className="legal-section">
              <h3>9. Changes to This Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice on the platform. Continued use of BizYip after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="legal-section">
              <h3>10. Contact</h3>
              <p>
                If you have questions about this Privacy Policy or want to request deletion of your data, contact us at <a href="mailto:jackpigpro@gmail.com" className="contact-email">jackpigpro@gmail.com</a>.
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
