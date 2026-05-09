import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data: existingComment, error: fetchError } = await supabase
      .from('idea_comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('idea_id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('idea_comments')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(`
        *,
        profiles(username, display_name)
      `)
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT /api/ideas/[id]/comments/[commentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingComment, error: fetchError } = await supabase
      .from('idea_comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('idea_id', id)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('idea_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ideas/[id]/comments/[commentId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
