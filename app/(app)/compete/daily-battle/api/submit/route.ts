import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { battleId, content } = await request.json()

    if (!battleId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Battle ID and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 300) {
      return NextResponse.json(
        { error: 'Content must be 300 characters or less' },
        { status: 400 }
      )
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user already submitted today
    const { data: existingSubmission } = await supabase
      .from('daily_submissions')
      .select('id')
      .eq('battle_id', battleId)
      .eq('user_id', user.id)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted for today' },
        { status: 400 }
      )
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('daily_submissions')
      .insert({
        battle_id: battleId,
        user_id: user.id,
        content: content.trim()
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json(
        { error: 'Failed to submit' },
        { status: 500 }
      )
    }

    // Calculate streak directly — more reliable than RPC
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    const { data: existingStreak } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak, last_submission_date')
      .eq('user_id', user.id)
      .single()

    let newCurrentStreak: number
    let newLongestStreak: number

    if (!existingStreak) {
      newCurrentStreak = 1
      newLongestStreak = 1
    } else {
      const lastDate = existingStreak.last_submission_date
      if (lastDate === yesterdayStr) {
        newCurrentStreak = (existingStreak.current_streak || 0) + 1
      } else if (lastDate === todayStr) {
        newCurrentStreak = existingStreak.current_streak || 1
      } else {
        newCurrentStreak = 1
      }
      newLongestStreak = Math.max(newCurrentStreak, existingStreak.longest_streak || 0)
    }

    await supabase
      .from('daily_streaks')
      .upsert(
        {
          user_id: user.id,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_submission_date: todayStr,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )

    // ELO matches the streak breakdown shown in the UI
    const eloGained = newCurrentStreak === 1 ? 1 : newCurrentStreak <= 6 ? 3 : 5

    // Update profiles.elo directly
    const { data: profileData } = await supabase
      .from('profiles')
      .select('elo')
      .eq('id', user.id)
      .single()

    const currentElo = profileData?.elo ?? 500
    const newElo = currentElo + eloGained

    await supabase
      .from('profiles')
      .update({ elo: newElo })
      .eq('id', user.id)

    await supabase
      .from('elo_history')
      .insert({
        user_id: user.id,
        elo_change: eloGained,
        new_elo: newElo,
        reason: 'daily_bellringer'
      })

    return NextResponse.json({
      success: true,
      submission,
      eloGained,
      streak: { current_streak: newCurrentStreak, longest_streak: newLongestStreak }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
