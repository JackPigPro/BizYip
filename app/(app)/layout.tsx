export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hero-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  )
}