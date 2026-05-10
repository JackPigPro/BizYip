'use client'

import { useState, useEffect } from 'react'
import { LiveStats } from '@/utils/stats'

export function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch('/api/stats', {
          cache: 'no-store', // Disable caching
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`)
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}
