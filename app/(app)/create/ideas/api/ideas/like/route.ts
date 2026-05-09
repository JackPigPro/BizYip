import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { idea_id } = body

    if (!idea_id) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 })
    }

    // Check if already liked
    const { data: existingLike, error: fetchError } = await supabase
      .from('idea_likes')
      .select('id')
      .eq('idea_id', idea_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing like:', fetchError)
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 })
    }

    if (existingLike) {
      // Unlike - delete the existing like
      const { error: deleteError } = await supabase
        .from('idea_likes')
        .delete()
        .eq('idea_id', idea_id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error unliking idea:', deleteError)
        return NextResponse.json({ error: 'Failed to unlike idea' }, { status: 500 })
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like - insert new like
      const { error: insertError } = await supabase
        .from('idea_likes')
        .insert({
          idea_id,
          user_id: user.id,
        })

      if (insertError) {
        console.error('Error liking idea:', insertError)
        return NextResponse.json({ error: 'Failed to like idea' }, { status: 500 })
      }

      // Get idea owner to send notification
      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select('user_id')
        .eq('id', idea_id)
        .single()

      if (!ideaError && idea && idea.user_id !== user.id) {
        // Send notification to idea owner (don't notify self)
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: idea.user_id,
            type: 'idea_liked',
            title: 'Someone liked your idea',
            body: 'Your idea received a like',
            reference_id: idea_id,
            reference_type: 'idea'
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error in POST /api/ideas/like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
