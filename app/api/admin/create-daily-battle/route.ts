import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { date, prompt } = await request.json()

    if (!date || !prompt?.trim()) {
      return NextResponse.json(
        { error: 'Date and prompt are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if battle already exists for this date
    const { data: existingBattle } = await supabase
      .from('daily_battle')
      .select('*')
      .eq('date', date)
      .single()

    if (existingBattle) {
      return NextResponse.json(
        { error: 'A battle already exists for this date' },
        { status: 400 }
      )
    }

    // Create daily battle
    const { data: battle, error: battleError } = await supabase
      .from('daily_battle')
      .insert({
        date: date,
        prompt: prompt.trim()
      })
      .select()
      .single()

    if (battleError) {
      return NextResponse.json(
        { error: 'Failed to create daily battle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      battle
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
