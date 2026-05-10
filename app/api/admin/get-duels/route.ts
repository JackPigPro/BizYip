import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Fetch all duels with submission counts
    const { data: duels, error: duelsError } = await supabase
      .from('weekly_duel')
      .select('*')
      .order('start_date', { ascending: false })

    if (duelsError) {
      return NextResponse.json({ error: 'Failed to fetch duels' }, { status: 500 })
    }

    // Get submission counts for each duel
    const duelIds = duels?.map(d => d.id) || []
    let submissionCounts: { [key: string]: number } = {}
    
    if (duelIds.length > 0) {
      const { data: submissions } = await supabase
        .from('duel_submissions')
        .select('duel_id')
        .in('duel_id', duelIds)

      submissionCounts = (submissions || []).reduce((acc, sub) => {
        acc[sub.duel_id] = (acc[sub.duel_id] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
    }

    // Transform duels to include submission counts
    const transformedDuels = (duels || []).map(duel => ({
      ...duel,
      submission_count: submissionCounts[duel.id] || 0
    }))

    return NextResponse.json({ 
      success: true, 
      duels: transformedDuels 
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
