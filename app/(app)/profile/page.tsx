'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/SupabaseProvider'

export default function ProfilePage() {
  const router = useRouter()
  const { user, authLoading } = useSupabase()

  useEffect(() => {
    if (authLoading) return
    
    const redirectToUserProfile = async () => {
      try {
        if (user) {
          // Get username from profile
          const response = await fetch('/profile/api')
          if (!response.ok) {
            throw new Error('Failed to fetch profile')
          }
          
          const data = await response.json()
          
          if (data.profile?.username) {
            router.replace(`/profile/${data.profile.username}`)
          } else {
            // User doesn't have a profile/username yet, redirect to onboarding
            router.replace('/onboarding')
          }
        } else {
          // Not logged in, redirect to login
          router.replace('/login')
        }
      } catch (error) {
        router.replace('/')
      }
    }

    redirectToUserProfile()
  }, [user, authLoading, router])

  // Remove blocking loading check - render page shell immediately
  // if (loading) {
  //   return (
  //     <div style={{ 
  //       minHeight: '100vh', 
  //       display: 'flex', 
  //       alignItems: 'center', 
  //       justifyContent: 'center',
  //       background: 'var(--bg)'
  //     }}>
  //       <div style={{ textAlign: 'center' }}>
  //         <div style={{ 
  //           width: '40px', 
  //           height: '40px', 
  //           border: '3px solid var(--border2)', 
  //           borderTop: '3px solid var(--green)', 
  //           borderRadius: '50%',
  //           animation: 'spin 1s linear infinite',
  //           margin: '0 auto 16px'
  //         }} />
  //         <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Loading profile...</p>
  //       </div>
  //       <style jsx>{`
  //         @keyframes spin {
  //           0% { transform: rotate(0deg); }
  //           100% { transform: rotate(360deg); }
  //         }
  //       `}</style>
  //     </div>
  //   )
  // }

  return null
}
