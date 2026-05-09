import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { rateLimit } from '@/utils/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // If no user, return empty array - allow public access to page
    if (!user) {
      return NextResponse.json({ data: [] })
    }

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'latest'
    const userId = searchParams.get('userId')
    const myIdeas = searchParams.get('myIdeas') === 'true'

    let query = supabase
      .from('ideas')
      .select(`
        *,
        idea_likes(id, user_id, created_at),
        idea_comments(id, user_id, parent_id, content, edited_at, created_at)
      `)

    if (myIdeas && userId) {
      // Show only current user's ideas (both public and private)
      query = query.eq('user_id', userId)
    } else {
      // Show only public ideas
      query = query.eq('is_public', true)
      
      // If userId is provided, also include private ideas for that user ONLY if it matches the logged-in user
      if (userId && userId === user.id) {
        query = query.or(`is_public.eq.true,user_id.eq.${userId}`)
      }
    }

    query = query.order('created_at', { ascending: false })

    const { data: ideas, error } = await query

    if (error) {
      console.error('Error fetching ideas:', error)
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
    }

    // Fetch profiles for all ideas
    const userIds = [...new Set(ideas?.map(idea => idea.user_id) || [])]
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Merge profiles with ideas and add counts
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const ideasWithProfiles = ideas?.map(idea => ({
      ...idea,
      profiles: profileMap.get(idea.user_id) || { username: 'unknown', display_name: 'Unknown User' },
      _count: {
        idea_likes: idea.idea_likes?.length || 0,
        idea_comments: idea.idea_comments?.length || 0
      }
    })) || []

    // Sort by most liked if requested
    if (sort === 'most_liked') {
      ideasWithProfiles.sort((a, b) => b._count.idea_likes - a._count.idea_likes)
    }

    return NextResponse.json({ data: ideasWithProfiles })
  } catch (error) {
    console.error('Error in GET /api/ideas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = rateLimit(user.id + '_ideas', 10, 60 * 60 * 1000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })

    const body = await request.json()
    const { title, content, is_public = true } = body

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

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title,
        content,
        is_public,
      })
      .select(`
        *,
        idea_likes(id, user_id, created_at),
        idea_comments(id, user_id, parent_id, content, edited_at, created_at)
      `)
      .single()

    if (error) {
      console.error('Error creating idea:', error)
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
    }

    // Fetch profile for the created idea
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
      ...idea,
      profiles: profile || { username: 'unknown', display_name: 'Unknown User' },
      _count: {
        idea_likes: idea.idea_likes?.length || 0,
        idea_comments: idea.idea_comments?.length || 0
      }
    }

    return NextResponse.json({ data: ideaWithProfile })
  } catch (error) {
    console.error('Error in POST /api/ideas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
