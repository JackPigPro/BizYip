import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single()

    // Hardcoded admin ID
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'

    if (!profile || profile.id !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { duelId } = await request.json()

    if (!duelId) {
      return NextResponse.json({ error: 'Duel ID is required' }, { status: 400 })
    }

    // First delete related submissions
    const { error: submissionsError } = await supabase
      .from('duel_submissions')
      .delete()
      .eq('duel_id', duelId)

    if (submissionsError) {
      return NextResponse.json({ error: 'Failed to delete duel submissions' }, { status: 500 })
    }

    // Delete related duel winners
    const { error: winnersError } = await supabase
      .from('duel_winners')
      .delete()
      .eq('duel_id', duelId)

    if (winnersError) {
      return NextResponse.json({ error: 'Failed to delete duel winners' }, { status: 500 })
    }

    // Delete the duel
    const { error: duelError } = await supabase
      .from('weekly_duel')
      .delete()
      .eq('id', duelId)

    if (duelError) {
      return NextResponse.json({ error: 'Failed to delete duel' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Duel deleted successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
