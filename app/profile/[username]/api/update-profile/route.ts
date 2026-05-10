import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileData = await request.json()
    
    // Input validation for profile update
    const { username, bio } = profileData
    
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim() === '') {
        return NextResponse.json({ error: 'Username must be a non-empty string' }, { status: 400 })
      }
      
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 })
      }
      
      if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
        return NextResponse.json({ error: 'Username must start with a letter and contain only letters, numbers, and underscores' }, { status: 400 })
      }
    }
    
    
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 })
      }
      
      if (bio.length > 500) {
        return NextResponse.json({ error: 'Bio must be at most 500 characters' }, { status: 400 })
      }
    }
    
    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: profileData.username,
        country: profileData.country,
        bio: profileData.bio,
        project_stage: profileData.project_stage,
        skills: profileData.skills,
        status_tags: profileData.status_tags,
        twitter: profileData.twitter || null,
        linkedin: profileData.linkedin || null
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
