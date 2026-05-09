export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, padding: '24px 32px' }}>
      {children}
    </div>
  )
}
