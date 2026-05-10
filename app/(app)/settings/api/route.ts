import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      profile,
      email: user.email,
      isEmailUser: user.app_metadata?.provider === 'email'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const type = formData.get('type') as string
    const password = formData.get('password') as string

    switch (type) {
      case 'update_username':
        const username = formData.get('username') as string
        if (!username || username.length < 3) {
          return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
        }

        // Check if username is already taken (case-insensitive)
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username)
          .neq('id', user.id)
          .single()

        if (existingUser) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', user.id)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case 'update_password':
        const currentPassword = formData.get('currentPassword') as string
        const newPassword = formData.get('newPassword') as string
        
        if (!currentPassword || !newPassword) {
          return NextResponse.json({ error: 'All password fields are required' }, { status: 400 })
        }

        if (newPassword.length < 6) {
          return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
        }

        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword
        })

        if (signInError) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (passwordError) {
          return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      
      case 'delete_account':

        // For email users, verify password before deletion
        if (user.app_metadata?.provider === 'email') {
          if (!password) {
            return NextResponse.json({ error: 'Password is required for account deletion' }, { status: 400 })
          }

          const { error: verifyDeleteError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password
          })

          if (verifyDeleteError) {
            return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 })
          }
        }

        // Delete user's profile first
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (deleteProfileError) {
          return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
        }


        // Delete daily streaks if they exist
        const { error: deleteStreaksError } = await supabase
          .from('daily_streaks')
          .delete()
          .eq('user_id', user.id)

        if (deleteStreaksError) {
          // Don't fail the whole operation if streaks deletion fails
        }

        // Delete ELO history if they exist
        const { error: deleteEloHistoryError } = await supabase
          .from('elo_history')
          .delete()
          .eq('user_id', user.id)

        if (deleteEloHistoryError) {
          // Don't fail the whole operation if ELO history deletion fails
        }

        // Create a service client with admin privileges for auth deletion
        const serviceClient = createServiceClient()

        // Delete user's auth account using admin API
        const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(user.id)

        if (deleteAuthError) {
          return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
        }

        // Return redirect to home page instead of JSON response
        return NextResponse.redirect(new URL('/', request.url))

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
