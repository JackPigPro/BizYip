import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Determine auth method from user identities
        let authMethod: 'email' | 'google' = 'email'
        
        if (user.identities && user.identities.length > 0) {
          const hasGoogleIdentity = user.identities.some(identity => identity.provider === 'google')
          const hasEmailIdentity = user.identities.some(identity => identity.provider === 'email')
          
          if (hasGoogleIdentity) authMethod = 'google'
          else if (hasEmailIdentity) authMethod = 'email'
        }
        
        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, onboarding_complete, auth_method')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile with correct auth method
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email?.toLowerCase() || '',
              auth_method: authMethod,
              onboarding_complete: false,
            })
        } else if (existingProfile.auth_method !== authMethod) {
          // Update auth method if it's incorrect
          await supabase
            .from('profiles')
            .update({ auth_method: authMethod })
            .eq('id', user.id)
        }

        const redirectTo = existingProfile?.onboarding_complete ? next : '/onboarding'
        
        // Add small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use client-side redirect to ensure browser fully reloads with new session
        return new NextResponse(null, {
          status: 302,
          headers: {
            'Location': `${origin}${redirectTo}`,
            'Set-Cookie': 'auth-redirect=true; Path=/; HttpOnly; SameSite=Lax'
          }
        })
      }
      
      // Add small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use client-side redirect to ensure browser fully reloads with new session
        return new NextResponse(null, {
          status: 302,
          headers: {
            'Location': `${origin}${next}`,
            'Set-Cookie': 'auth-redirect=true; Path=/; HttpOnly; SameSite=Lax'
          }
        })
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      // If this is a signup email confirmation, redirect to verified page
      if (type === 'signup') {
        return NextResponse.redirect(`${origin}/verified`)
      }

      // For other types (magic links, etc.), proceed with normal redirect
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single()

        const redirectTo = profile?.onboarding_complete ? next : '/onboarding'
        
        // Add small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use client-side redirect to ensure browser fully reloads with new session
        return new NextResponse(null, {
          status: 302,
          headers: {
            'Location': `${origin}${redirectTo}`,
            'Set-Cookie': 'auth-redirect=true; Path=/; HttpOnly; SameSite=Lax'
          }
        })
      }
      
      // Add small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use client-side redirect to ensure browser fully reloads with new session
        return new NextResponse(null, {
          status: 302,
          headers: {
            'Location': `${origin}${next}`,
            'Set-Cookie': 'auth-redirect=true; Path=/; HttpOnly; SameSite=Lax'
          }
        })
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
