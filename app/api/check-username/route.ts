import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { containsBannedWord } from '@/lib/moderation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')
  const currentUserId = searchParams.get('currentUserId')

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const trimmedUsername = username.trim().toLowerCase()

  // Validate username format (same as onboarding)
  const validationRules = [
    {
      test: trimmedUsername.length >= 3 && trimmedUsername.length <= 15,
      message: 'Username must be 3-15 characters'
    },
    {
      test: /^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername),
      message: 'Username must start with a letter and contain only letters, numbers, and underscores'
    }
  ]

  const failedRule = validationRules.find(rule => !rule.test)
  if (failedRule) {
    return NextResponse.json({ 
      available: false, 
      error: failedRule.message 
    }, { status: 400 })
  }

  // Check for banned words (same as onboarding)
  if (containsBannedWord(trimmedUsername)) {
    return NextResponse.json({ 
      available: false, 
      error: 'Inappropriate content. Please rewrite.' 
    }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    
    // Check if username exists (case-insensitive), excluding current user
    let query = supabase
      .from('profiles')
      .select('username')
      .ilike('username', username.trim()) // Case-insensitive comparison
    
    // If currentUserId is provided, exclude the current user's record
    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }
    
    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ 
        available: false, 
        error: 'Failed to check username availability' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      available: !data, // available if no data found
      username: username.trim()
    })
  } catch (error) {
    return NextResponse.json({ 
      available: false, 
      error: 'Server error' 
    }, { status: 500 })
  }
}
