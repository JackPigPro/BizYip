'use client'

import { useCallback } from 'react'
import Landing from './Landing'
import { LiveStats } from '@/utils/stats'

interface LandingPageProps {
  stats?: LiveStats
}

export default function LandingPage({ stats }: LandingPageProps) {
  const scrollToCenter = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const elRect = el.getBoundingClientRect()
    const navOffset = 76
    const elCenter = elRect.top + window.scrollY + elRect.height / 2
    const viewportCenter = window.innerHeight / 2
    window.scrollTo({ top: elCenter - viewportCenter, behavior: 'smooth' })
  }, [])

  return (
    <Landing 
      onScrollTo={scrollToCenter}
      stats={stats}
    />
  )
}
