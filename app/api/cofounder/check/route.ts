import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
    }

    // Get target user's message preference
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('message_preference')
      .eq('id', user_id)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // If target user allows messages from anyone, skip cofounder check
    if (targetProfile.message_preference !== 'cofounder_only') {
      return NextResponse.json({ data: { canMessage: true } })
    }

    // Check if there's an accepted cofounder request between the two users (bidirectional check)
    const { data: cofounderRequest, error } = await supabase
      .from('cofounder_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${user_id}),and(sender_id.eq.${user_id},receiver_id.eq.${user.id})`)
      .single()

    if (error || !cofounderRequest) {
      return NextResponse.json({ error: 'No accepted cofounder request found' }, { status: 403 })
    }

    return NextResponse.json({ data: { canMessage: true } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
