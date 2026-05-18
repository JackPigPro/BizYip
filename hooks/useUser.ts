'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/utils/auth-client'

interface UserElo {
  elo?: number
}

interface UserCache {
  profile: UserProfile | null
  elo: UserElo | null
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000
const userCache = new Map<string, UserCache>()

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [elo, setElo] = useState<UserElo | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isLoading = loading || authLoading
  const isAuthenticated = !!user && !!profile && (profile.onboarding_complete === true || profile.onboarding_complete == null)
  const username = profile?.username
  const status_tags = profile?.status_tags

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const fetchUserData = async (userId: string) => {
      try {
        setLoading(true)
        setError(null)

        const cached = userCache.get(userId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.profile) {
          setProfile(cached.profile)
          setElo(cached.elo)
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, status_tags, onboarding_complete, created_at, elo')
          .eq('id', userId)
          .single()

        console.log('useUser fetchUserData - profileData:', profileData)

        if (!mounted) return

        const newProfile = profileData || null
        const newElo = newProfile?.elo ? { elo: newProfile.elo } : null

        userCache.set(userId, {
          profile: newProfile,
          elo: newElo,
          timestamp: Date.now()
        })

        setProfile(newProfile)
        setElo(newElo)
      } catch (err) {
        if (mounted) setError('Failed to load user data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange subscription created')
      console.log('onAuthStateChange fired:', event, session?.user?.id)
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        await fetchUserData(currentUser.id)
      } else {
        setProfile(null)
        setElo(null)
        setLoading(false)
        userCache.clear()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refresh = async () => {
    if (user) {
      userCache.delete(user.id)
      const supabase = createClient()
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, status_tags, onboarding_complete, created_at, elo')
        .eq('id', user.id)
        .single()
      const newProfile = profileData || null
      const newElo = newProfile?.elo ? { elo: newProfile.elo } : null
      userCache.set(user.id, { profile: newProfile, elo: newElo, timestamp: Date.now() })
      setProfile(newProfile)
      setElo(newElo)
    }
  }

  const invalidateCache = () => {
    if (user) userCache.delete(user.id)
  }

  return {
    user, profile, elo, username, status_tags,
    loading, authLoading, isLoading, isAuthenticated, error,
    refresh, invalidateCache
  }
}

export function clearUserCache() { userCache.clear() }
export function invalidateUserCache(userId: string) { userCache.delete(userId) }