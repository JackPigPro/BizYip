import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { content, duel_id } = await request.json()
    
    // UUID validation helper
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    // Input validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    
    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be at most 10000 characters' },
        { status: 400 }
      )
    }
    
    if (!duel_id || typeof duel_id !== 'string' || !isValidUUID(duel_id)) {
      return NextResponse.json(
        { error: 'duel_id is required and must be a valid UUID format' },
        { status: 400 }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const allowed = rateLimit(user.id + '_duel_submit', 1, 10080 * 60 * 1000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })

    // Check if user already submitted to this duel
    const { data: existingSubmission } = await supabase
      .from('duel_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('duel_id', duel_id)
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted to this duel' },
        { status: 400 }
      )
    }

    // Insert new submission
    const { data: submission, error: submissionError } = await supabase
      .from('duel_submissions')
      .insert({
        user_id: user.id,
        duel_id: duel_id,
        content: content,
        vote_score: 0,
        vote_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error('Submission insert error:', {
        error: submissionError,
        message: submissionError?.message,
        details: submissionError?.details,
        hint: submissionError?.hint,
        code: submissionError?.code,
        user_id: user.id,
        duel_id: duel_id
      })
      return NextResponse.json(
        { error: 'Failed to submit idea', details: submissionError?.message },
        { status: 500 }
      )
    }

    // Grant +10 ELO immediately for weekly duel submission
    try {
      console.log('Granting +10 ELO for weekly duel submission to user:', user.id)
      
      // Update user_stats.elo
      const { data: updatedStats, error: eloUpdateError } = await supabase
        .from('user_stats')
        .update({ elo: supabase.rpc('increment', { amount: 10 }) })
        .eq('user_id', user.id)
        .select('elo')
        .single()

      if (eloUpdateError) {
        console.error('ELO update error:', eloUpdateError)
        // Don't fail the submission, just log the error
      } else {
        // Log to elo_history
        const { error: historyError } = await supabase
          .from('elo_history')
          .insert({
            user_id: user.id,
            change: 10,
            reason: 'weekly_duel_entry',
            created_at: new Date().toISOString()
          })

        if (historyError) {
          console.error('ELO history logging error:', historyError)
        }

        console.log('Successfully granted +10 ELO for weekly duel submission')
      }
    } catch (eloError) {
      console.error('Unexpected error during ELO grant:', eloError)
      // Don't fail the submission for ELO issues
    }

    return NextResponse.json(
      { 
        success: true,
        eloGained: 10,
        submission: {
          id: submission.id,
          content: submission.content,
          created_at: submission.created_at
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Submit submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { content, duel_id } = await request.json()
    
    // UUID validation helper
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    // Input validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    
    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be at most 10000 characters' },
        { status: 400 }
      )
    }
    
    if (!duel_id || typeof duel_id !== 'string' || !isValidUUID(duel_id)) {
      return NextResponse.json(
        { error: 'duel_id is required and must be a valid UUID format' },
        { status: 400 }
      )
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Rate limiting for updates (more lenient than new submissions)
    const allowed = rateLimit(user.id + '_duel_update', 10, 60000) // 10 updates per minute
    if (!allowed) return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })

    // Check if user has an existing submission to this duel
    const { data: existingSubmission } = await supabase
      .from('duel_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('duel_id', duel_id)
      .maybeSingle()

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'No existing submission found for this duel' },
        { status: 400 }
      )
    }

    // Check if duel is still in active status (allow editing only during active phase)
    console.log('Checking duel status for duel_id:', duel_id)
    
    const { data: duel, error: duelError } = await supabase
      .from('weekly_duel')
      .select('id, status, prompt, start_date, end_date')
      .eq('id', duel_id)
      .single()

    console.log('Duel query result:', { duel, duelError })

    if (duelError) {
      console.error('Duel status check error:', {
        error: duelError,
        message: duelError?.message,
        details: duelError?.details,
        hint: duelError?.hint,
        code: duelError?.code,
        duel_id: duel_id
      })
      return NextResponse.json(
        { error: 'Failed to verify duel status', details: duelError?.message },
        { status: 500 }
      )
    }

    if (!duel) {
      console.error('Duel not found with ID:', duel_id)
      return NextResponse.json(
        { error: 'Duel not found' },
        { status: 404 }
      )
    }

    console.log('Duel found:', { id: duel.id, status: duel.status })

    if (duel.status !== 'active') {
      console.log('Duel edit blocked - status not active:', duel.status)
      return NextResponse.json(
        { error: `Can only edit submissions while duel is in active status. Current status: ${duel.status}` },
        { status: 400 }
      )
    }

    // Update existing submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('duel_submissions')
      .update({
        content: content
      })
      .eq('id', existingSubmission.id)
      .select()
      .single()

    if (updateError || !updatedSubmission) {
      console.error('Submission update error:', {
        error: updateError,
        message: updateError?.message,
        details: updateError?.details,
        hint: updateError?.hint,
        code: updateError?.code,
        submission_id: existingSubmission.id
      })
      return NextResponse.json(
        { error: 'Failed to update submission', details: updateError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        submission: {
          id: updatedSubmission.id,
          content: updatedSubmission.content,
          created_at: updatedSubmission.created_at
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
