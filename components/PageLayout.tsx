'use client'

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      {children}
    </>
  )
}
