import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { match_id } = await request.json()

    if (!match_id) {
      return NextResponse.json({ error: 'Missing match_id' }, { status: 400 })
    }

    // Check if user owns this match and it's in waiting state
    const { data: match, error: findError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .eq('status', 'waiting')
      .eq('player1_id', user.id)
      .single()

    if (findError || !match) {
      return NextResponse.json({ error: 'Match not found or cannot be cancelled' }, { status: 404 })
    }

    // Delete the match
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('id', match_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to cancel match' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
