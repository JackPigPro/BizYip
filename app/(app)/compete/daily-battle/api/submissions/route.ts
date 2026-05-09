import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const battleId = searchParams.get('battleId')

    if (!battleId) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
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

    // Get authenticated user (optional for likes)
    const { data: { user } } = await supabase.auth.getUser()

    // If no user, return empty array - allow public access to page
    if (!user) {
      return NextResponse.json([])
    }

    // Fetch submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('daily_submissions')
      .select(`
        id,
        content,
        created_at,
        user_id
      `)
      .eq('battle_id', battleId)
      .order('created_at', { ascending: false })

    if (submissionsError) {
      console.error('Submissions fetch error:', submissionsError)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json([])
    }

    // Get user profiles for all submissions
    const userIds = submissions.map(s => s.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      )
    }

    // Get like counts for all submissions
    const submissionIds = submissions.map(s => s.id)
    const { data: likes, error: likesError } = await supabase
      .from('daily_likes')
      .select('submission_id, user_id')
      .in('submission_id', submissionIds)

    if (likesError) {
      console.error('Likes fetch error:', likesError)
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    // Count likes per submission
    const likeCounts: Record<string, number> = {}
    const userLikes: Record<string, boolean> = {}
    
    likes?.forEach(like => {
      likeCounts[like.submission_id] = (likeCounts[like.submission_id] || 0) + 1
      if (user && like.user_id === user.id) {
        userLikes[like.submission_id] = true
      }
    })

    // Merge data
    const mergedSubmissions = submissions.map(submission => {
      const profile = profiles?.find(p => p.id === submission.user_id)
      return {
        id: submission.id,
        content: submission.content,
        username: profile?.username || 'unknown',
        display_name: profile?.display_name || profile?.username || 'Unknown',
        created_at: submission.created_at,
        likes: likeCounts[submission.id] || 0,
        user_liked: userLikes[submission.id] || false,
        user_id: submission.user_id
      }
    })

    return NextResponse.json(mergedSubmissions)

  } catch (error) {
    console.error('Submissions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
