import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { game_mode, room_code, prompt, time_limit_seconds } = await request.json()

    if (!game_mode || !room_code || !prompt || !time_limit_seconds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if room code already exists
    const { data: existingRoom } = await supabase
      .from('matches')
      .select('id')
      .eq('room_code', room_code)
      .single()

    if (existingRoom) {
      return NextResponse.json({ error: 'Room code already exists' }, { status: 409 })
    }

    // Create private room
    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        game_mode,
        status: 'waiting',
        player1_id: user.id,
        prompt,
        time_limit_seconds,
        room_code,
        is_private: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
