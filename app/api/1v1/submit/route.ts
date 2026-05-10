import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { match_id, user_id, content, image_url } = await request.json()

    if (!match_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('player1_id, player2_id, status')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.player1_id !== user_id && match.player2_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (match.status !== 'active') {
      return NextResponse.json({ error: 'Match is not active' }, { status: 400 })
    }

    // Create or update submission
    const { data: submission, error: submissionError } = await supabase
      .from('match_submissions')
      .upsert({
        match_id,
        user_id,
        content,
        image_url
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    // Update match submission flags
    const isPlayer1 = match.player1_id === user_id
    const updateField = isPlayer1 ? 'player1_submitted' : 'player2_submitted'
    
    const { error: updateError } = await supabase
      .from('matches')
      .update({ [updateField]: true })
      .eq('id', match_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
    }

    // Check if both players have submitted
    const { data: updatedMatch, error: checkError } = await supabase
      .from('matches')
      .select('player1_submitted, player2_submitted')
      .eq('id', match_id)
      .single()

    if (!checkError && updatedMatch?.player1_submitted && updatedMatch?.player2_submitted) {
      // Both players submitted, move to voting phase
      await supabase
        .from('matches')
        .update({ 
          status: 'voting',
          completed_at: new Date().toISOString()
        })
        .eq('id', match_id)
    }

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
