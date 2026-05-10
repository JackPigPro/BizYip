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
        // Check if profile exists, create if not (for Google OAuth users)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, onboarding_complete')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile for Google OAuth user
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email?.toLowerCase() || '',
              auth_method: 'google',
              onboarding_complete: false,
            })
        }

        const redirectTo = existingProfile?.onboarding_complete ? next : '/onboarding'
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
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
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
