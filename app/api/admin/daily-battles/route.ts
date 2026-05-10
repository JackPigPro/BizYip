import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all daily battles
    const { data: battles, error: battlesError } = await supabase
      .from('daily_battle')
      .select('*')
      .order('date', { ascending: false })

    if (battlesError) {
      return NextResponse.json(
        { error: 'Failed to fetch daily battles' },
        { status: 500 }
      )
    }

    // Get submission counts for each battle
    const battleIds = battles?.map(b => b.id) || []
    const submissionCounts: Record<string, number> = {}

    if (battleIds.length > 0) {
      const { data: submissions, error: submissionsError } = await supabase
        .from('daily_submissions')
        .select('battle_id')
        .in('battle_id', battleIds)

      if (submissionsError) {
      } else {
        submissions?.forEach(submission => {
          submissionCounts[submission.battle_id] = (submissionCounts[submission.battle_id] || 0) + 1
        })
      }
    }

    // Merge submission counts
    const battlesWithCounts = battles?.map(battle => ({
      ...battle,
      submission_count: submissionCounts[battle.id] || 0
    })) || []

    return NextResponse.json({
      success: true,
      battles: battlesWithCounts
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
