'use client'

import Footer from '@/components/Footer'
import { LiveStats } from '@/utils/stats'

interface LandingFooterProps {
  stats?: LiveStats
}

export default function LandingFooter({ stats }: LandingFooterProps) {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const elRect = el.getBoundingClientRect()
    const navOffset = 76
    const elCenter = elRect.top + window.scrollY + elRect.height / 2
    const viewportCenter = window.innerHeight / 2
    window.scrollTo({ top: elCenter - viewportCenter, behavior: 'smooth' })
  }

  return (
    <Footer 
      onScrollTo={handleScrollTo} 
      stats={stats} 
    />
  )
}
