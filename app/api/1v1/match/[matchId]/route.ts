import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { matchId } = await params

    // Fetch match with player details
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!matches_player1_id_fkey (username),
        player2:profiles!matches_player2_id_fkey (username)
      `)
      .eq('id', matchId)
      .single()

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if user is authorized to view this match
    if (match.player1_id !== user.id && match.player2_id !== user.id && match.is_private) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    console.error('Fetch match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
