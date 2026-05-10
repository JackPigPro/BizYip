import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single()

    // Hardcoded admin ID
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'

    if (!profile || profile.id !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { prompt, start_date, end_date } = await request.json()

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    // Call the updated Supabase function with new parameters
    const { data, error } = await supabase.rpc('create_weekly_duel', {
      prompt_text: prompt.trim(),
      start_date: start_date,
      end_date: end_date
    })


    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to create weekly duel', details: error }, { status: 500 })
    }

    // The function returns a JSON object with success, duel_id, etc.
    if (data && data.success) {
      return NextResponse.json({ 
        success: true, 
        duel_id: data.duel_id,
        duel: {
          id: data.duel_id,
          prompt: prompt.trim(),
          start_date: start_date,
          end_date: end_date,
          status: data.status,
          prize_distributed: false
        }
      }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, error: data?.error || 'Failed to create duel' }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
