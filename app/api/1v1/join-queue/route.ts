import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { game_mode, prompt, time_limit_seconds } = await request.json()

    if (!game_mode || !prompt || !time_limit_seconds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, try to find an existing waiting match for this game mode
    const { data: existingMatch, error: findError } = await supabase
      .from('matches')
      .select('*')
      .eq('game_mode', game_mode)
      .eq('status', 'waiting')
      .eq('is_private', false)
      .not('player1_id', 'eq', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (existingMatch && !findError) {
      // Join existing match
      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({
          player2_id: user.id,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', existingMatch.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'Failed to join match' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: updatedMatch })
    }

    // No existing match found, create a new one
    const { data: newMatch, error: createError } = await supabase
      .from('matches')
      .insert({
        game_mode,
        status: 'waiting',
        player1_id: user.id,
        prompt,
        time_limit_seconds,
        is_private: false
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: newMatch })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
