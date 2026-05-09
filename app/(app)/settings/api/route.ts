import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      profile,
      email: user.email,
      isEmailUser: user.app_metadata?.provider === 'email'
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'update_username':
        const { username } = data
        if (!username || username.length < 3) {
          return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
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
        const { currentPassword, newPassword } = data
        
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
        const { password } = data

        // Verify password before deletion
        const { error: verifyDeleteError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password
        })

        if (verifyDeleteError) {
          return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 })
        }

        // Delete user's profile
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (deleteProfileError) {
          return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
        }

        // Delete user's auth account
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)

        if (deleteAuthError) {
          return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
