'use client'

import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <>
      <main className="content-page">
        <div className="content-container">
          <div className="content-header">
            <h1 className="content-title">Contact Us</h1>
            <p className="content-subtitle">We'd love to hear from you — whether you have a question, feedback, a bug to report, or just want to talk about what you're building.</p>
          </div>
          
          <div className="contact-grid">
            <div className="contact-card">
              <h3>📧 General Inquiries</h3>
              <p>
                Have questions about BizYip? Want to learn more about our platform or share your thoughts? We're here to help.
              </p>
              <a href="mailto:thejacksegal@gmail.com" className="contact-email">
                thejacksegal@gmail.com
              </a>
              <p>
                <small>We typically respond within 1-2 business days.</small>
              </p>
            </div>

            <div className="contact-card">
              <h3>🐛 Report a Bug</h3>
              <p>
                Found something broken? Help us improve BizYip by reporting any issues you encounter.
              </p>
              <a href="mailto:thejacksegal@gmail.com?subject=Bug%20Report" className="contact-email">
                thejacksegal@gmail.com
              </a>
              <p>
                <small>Please include "Bug Report" in the subject line and describe what happened. Screenshots help!</small>
              </p>
            </div>

            <div className="contact-card">
              <h3>🤝 Press & Partnerships</h3>
              <p>
                Interested in working with BizYip? Whether you're from the press, a school, or an organization, we'd love to explore collaboration opportunities.
              </p>
              <a href="mailto:thejacksegal@gmail.com?subject=Partnership" className="contact-email">
                thejacksegal@gmail.com
              </a>
              <p>
                <small>Please include "Partnership" in the subject line.</small>
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
