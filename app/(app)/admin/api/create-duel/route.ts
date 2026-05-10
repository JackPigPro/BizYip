import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { prompt_text, start_date, end_date } = await request.json()
    
    if (!prompt_text || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt_text, start_date, end_date' },
        { status: 400 }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Call the updated Supabase function with new parameters
    const { data, error } = await supabase.rpc('create_weekly_duel', {
      prompt_text: prompt_text.trim(),
      start_date: start_date,
      end_date: end_date
    })

    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to create duel',
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'No data returned from function'
      }, { status: 500 })
    }

    if (data) {
      return NextResponse.json({ 
        success: true, 
        duel_id: data
      }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, error: 'Failed to create duel' }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
