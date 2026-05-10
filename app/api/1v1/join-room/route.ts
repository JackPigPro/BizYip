import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { room_code, game_mode } = await request.json()

    if (!room_code || !game_mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the waiting match with this room code
    const { data: match, error: findError } = await supabase
      .from('matches')
      .select('*')
      .eq('room_code', room_code)
      .eq('status', 'waiting')
      .eq('game_mode', game_mode)
      .single()

    if (findError || !match) {
      return NextResponse.json({ error: 'Room not found or already full' }, { status: 404 })
    }

    // Check if user is trying to join their own room
    if (match.player1_id === user.id) {
      return NextResponse.json({ error: 'Cannot join your own room' }, { status: 400 })
    }

    // Update match to active with player2
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        player2_id: user.id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', match.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedMatch })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
