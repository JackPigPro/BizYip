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

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content must be 500 characters or less' },
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

    // Get authenticated user
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
      .select('*')
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
      console.error('Submission error:', submissionError)
      return NextResponse.json(
        { error: 'Failed to submit' },
        { status: 500 }
      )
    }

    // Update daily streak and get ELO gained
    const { data: eloGained, error: streakError } = await supabase.rpc('update_daily_streak', {
      p_user_id: user.id
    })
    
    console.log('ELO gained:', eloGained, 'Error:', streakError)

    if (streakError) {
      console.error('Streak update error:', streakError)
      // Don't fail the submission if streak update fails
    }

    // Query daily_streaks table to verify the row was created/updated
    const { data: streak } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      submission,
      eloGained,
      streak
    })

  } catch (error) {
    console.error('Submit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
