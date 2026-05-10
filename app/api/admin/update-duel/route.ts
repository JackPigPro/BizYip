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

    const { id, prompt, start_date, end_date, status } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Duel ID is required' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (prompt !== undefined) updateData.prompt = prompt
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (status !== undefined) updateData.status = status

    // Update the duel
    const { data: updatedDuel, error: updateError } = await supabase
      .from('weekly_duel')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update duel', details: updateError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      duel: updatedDuel,
      message: 'Duel updated successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
