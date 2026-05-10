import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, status_tags, onboarding_complete, created_at, elo, bio, country, project_stage, skills, twitter, linkedin')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Fetch user stats
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('id')
      .eq('user_id', user.id)

    if (ideasError) {
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
    }

    const { data: likes, error: likesError } = await supabase
      .from('idea_likes')
      .select('idea_id, created_at, user_id')
      .in('idea_id', ideas?.map((i: any) => i.id) || [])

    if (likesError) {
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    const { data: comments, error: commentsError } = await supabase
      .from('idea_comments')
      .select('id, idea_id, created_at, user_id, content')
      .in('idea_id', ideas?.map((i: any) => i.id) || [])
      .neq('user_id', user.id) // Exclude user's own comments

    if (commentsError) {
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Combine and sort recent activity
    const recentActivity = [
      ...(likes?.map(like => ({
        type: 'like',
        idea_id: like.idea_id,
        created_at: like.created_at,
        user_id: like.user_id
      })) || []),
      ...(comments?.map(comment => ({
        type: 'comment',
        idea_id: comment.idea_id,
        created_at: comment.created_at,
        user_id: comment.user_id,
        content: comment.content
      })) || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 10) // Get latest 10 activities

    const stats = {
      ideas_count: ideas?.length || 0,
      likes_received: likes?.length || 0,
      comments_count: comments?.length || 0,
      elo: profile?.elo || 500,
      rank: 'Builder'
    }

    return NextResponse.json({
      profile,
      stats,
      recentActivity
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
