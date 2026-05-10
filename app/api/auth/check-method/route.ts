import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
  }
  
  try {
    const supabase = createServiceClient()
    
    // Try to get user by email from Supabase auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (!listError && users) {
      const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (user) {
        // 1. Check app_metadata.provider first (most reliable)
        if (user.app_metadata?.provider) {
          if (user.app_metadata.provider === 'google') {
            return NextResponse.json({ authMethod: 'google' })
          }
          if (user.app_metadata.provider === 'email') {
            return NextResponse.json({ authMethod: 'email' })
          }
        }
        
        // 2. If no app_metadata, check identities array
        if (user.identities && user.identities.length > 0) {
          const hasGoogleIdentity = user.identities.some((identity: any) => identity.provider === 'google')
          const hasEmailIdentity = user.identities.some((identity: any) => identity.provider === 'email')
          
          if (hasGoogleIdentity) return NextResponse.json({ authMethod: 'google' })
          if (hasEmailIdentity) return NextResponse.json({ authMethod: 'email' })
        }
        
        // 3. If no identities, check profiles table auth_method
        const { data: profile } = await supabase
          .from('profiles')
          .select('auth_method')
          .eq('email', email.toLowerCase())
          .single()
        
        if (profile?.auth_method) {
          return NextResponse.json({ authMethod: profile.auth_method })
        }
        
        // 4. If all sources are empty, default to 'email'
        return NextResponse.json({ authMethod: 'email' })
      }
    }
    
    // Fallback: check profiles table if user not found in auth
    const { data: profile } = await supabase
      .from('profiles')
      .select('auth_method')
      .eq('email', email.toLowerCase())
      .single()
    
    if (profile?.auth_method) {
      return NextResponse.json({ authMethod: profile.auth_method })
    }
    
    // Return null if no user found at all
    return NextResponse.json({ authMethod: null })
  } catch (error) {
    console.error('Auth method check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
