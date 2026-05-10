import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If no user, return empty array - allow public access to page
    if (authError || !user) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { matchId } = await params

    // Fetch submissions with user details
    const { data: submissions, error } = await supabase
      .from('match_submissions')
      .select(`
        *,
        user:profiles!match_submissions_user_id_fkey (username)
      `)
      .eq('match_id', matchId)

    if (error) {
      console.error('Fetch submissions error:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: submissions })
  } catch (error) {
    console.error('Fetch submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
