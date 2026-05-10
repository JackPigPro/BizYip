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

    // Find the current voting duel
    const { data: currentDuel, error: duelError } = await supabase
      .from('weekly_duel')
      .select('*')
      .eq('status', 'voting')
      .single()

    if (duelError || !currentDuel) {
      return NextResponse.json({ error: 'No voting duel found' }, { status: 404 })
    }

    // Call distribute_duel_prizes function
    const { data: prizeResult, error: prizeError } = await supabase.rpc('distribute_duel_prizes', {
      duel_id_param: currentDuel.id
    })

    if (prizeError) {
      return NextResponse.json({ error: 'Failed to distribute prizes', details: prizeError }, { status: 500 })
    }

    // Activate the next queued duel if one exists
    const { error: activateError } = await supabase
      .from('weekly_duel')
      .update({ status: 'active' })
      .eq('status', 'queued')
      .order('start_date', { ascending: true })
      .limit(1)

    if (activateError) {
      // Don't return error here, just log it since prizes were distributed
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Prizes distributed successfully',
      duel_id: currentDuel.id,
      prize_result: prizeResult
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
