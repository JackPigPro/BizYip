import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
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

    // Check if user already liked this submission and get submission owner in one query
    const { data: existingData, error: checkError } = await supabase
      .from('daily_likes')
      .select('user_id, daily_submissions!inner(user_id)')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Like check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check like status' },
        { status: 500 }
      )
    }

    if (existingData) {
      return NextResponse.json(
        { error: 'You have already liked this submission' },
        { status: 400 }
      )
    }

    // Get submission owner to check self-like
    const { data: submission } = await supabase
      .from('daily_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single()

    if (submission?.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot like your own submission' },
        { status: 400 }
      )
    }

    // Create like
    const { data: like, error: likeError } = await supabase
      .from('daily_likes')
      .insert({
        submission_id: submissionId,
        user_id: user.id
      })
      .select()
      .single()

    if (likeError) {
      console.error('Like error:', likeError)
      return NextResponse.json(
        { error: 'Failed to like submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      like
    })

  } catch (error) {
    console.error('Like POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
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

    // Delete like
    const { error: deleteError } = await supabase
      .from('daily_likes')
      .delete()
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Unlike error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to unlike submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Like DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
