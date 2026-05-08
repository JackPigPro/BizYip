import Link from 'next/link'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const sp = await searchParams
  const mode = sp.mode === 'signup' ? 'signup' : 'login'

  return (
    <main
        className=""
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px 24px 32px',
          marginTop: '-68px',
          background: 'var(--bg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`.nav{display:none !important}`}</style>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            pointerEvents: 'none',
          }}
        />
        <div className="auth-deco auth-deco-1 hero-deco-card">
          <div className="hdc-badge b">🔥 Daily Battle</div>
          <div className="hdc-text">streak — 7 days</div>
        </div>
        <div className="auth-deco auth-deco-2 hero-deco-card">
          <div className="hdc-badge g">⚔️ Weekly Duel</div>
          <div className="hdc-text">submissions open</div>
        </div>
        <div className="auth-deco auth-deco-3 hero-deco-card">
          <div className="hdc-badge p">📈 ELO Rating</div>
          <div className="hdc-text">Builder rank</div>
        </div>
        <div className="auth-deco auth-deco-4 hero-deco-card">
          <div className="hdc-badge o">👋 Co-founder Match</div>
          <div className="hdc-text">3 new requests</div>
        </div>
        <div className="auth-deco auth-deco-5 hero-deco-card">
          <div className="hdc-badge b">🏆 Leaderboard</div>
          <div className="hdc-text">Top 10 builder</div>
        </div>
        <div className="auth-deco auth-deco-6 hero-deco-card">
          <div className="hdc-badge g">💬 Messages</div>
          <div className="hdc-text">5 new notifications</div>
        </div>
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '544px' }}>
          <LoginForm mode={mode} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', width: '100%' }}>
            <Link href="/" className="auth-back-link">
              ← Back to home
            </Link>
            <Link 
              href={mode === 'signup' ? '/login?mode=login' : '/login?mode=signup'} 
              className="auth-back-link"
            >
              {mode === 'signup' ? 'Sign in instead' : 'Create an account'}
            </Link>
          </div>
        </div>
      </main>
    )
}
