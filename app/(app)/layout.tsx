import { UserProvider } from '@/contexts/UserContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <>
        <div className="hero-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </>
    </UserProvider>
  )
}