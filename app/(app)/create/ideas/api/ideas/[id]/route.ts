import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, is_public } = body

    // Input validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required and must be a non-empty string' }, { status: 400 })
    }
    
    if (title.length > 100) {
      return NextResponse.json({ error: 'Title must be at most 100 characters' }, { status: 400 })
    }
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required and must be a non-empty string' }, { status: 400 })
    }
    
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content must be at most 5000 characters' }, { status: 400 })
    }
    
    if (typeof is_public !== 'boolean') {
      return NextResponse.json({ error: 'is_public must be a boolean' }, { status: 400 })
    }

    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    if (existingIdea.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('ideas')
      .update({
        title,
        content,
        is_public,
        edited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        idea_likes(id, user_id, created_at),
        idea_comments(id, user_id, parent_id, content, edited_at, created_at)
      `)
      .single()

    if (error) {
      console.error('Error updating idea:', error)
      return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 })
    }

    // Fetch profile for the updated idea
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Add counts and profile to the response
    const ideaWithProfile = {
      ...data,
      profiles: profile || { username: 'unknown', display_name: 'Unknown User' },
      _count: {
        idea_likes: data.idea_likes?.length || 0,
        idea_comments: data.idea_comments?.length || 0
      }
    }

    return NextResponse.json({ data: ideaWithProfile })
  } catch (error) {
    console.error('Error in PUT /api/ideas/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    if (existingIdea.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting idea:', error)
      return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ideas/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
