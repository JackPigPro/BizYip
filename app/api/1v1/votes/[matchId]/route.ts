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

    // Fetch votes for this match
    const { data: votes, error } = await supabase
      .from('match_votes')
      .select('*')
      .eq('match_id', matchId)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: votes })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
