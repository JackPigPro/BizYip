import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { match_id, voted_for_id } = await request.json()

    if (!match_id || !voted_for_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Cannot vote for yourself
    if (user.id === voted_for_id) {
      return NextResponse.json({ error: 'Cannot vote for yourself' }, { status: 400 })
    }

    // Check if match exists and is in voting phase
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('player1_id, player2_id, status')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'voting') {
      return NextResponse.json({ error: 'Voting is not open for this match' }, { status: 400 })
    }

    // Check if user is a participant (participants cannot vote)
    if (match.player1_id === user.id || match.player2_id === user.id) {
      return NextResponse.json({ error: 'Match participants cannot vote' }, { status: 403 })
    }

    // Check if voted_for_id is a participant
    if (match.player1_id !== voted_for_id && match.player2_id !== voted_for_id) {
      return NextResponse.json({ error: 'Invalid vote target' }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('match_votes')
      .select('id')
      .eq('match_id', match_id)
      .eq('voter_id', user.id)
      .single()

    if (existingVote || !voteCheckError) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 409 })
    }

    // Create vote
    const { data: vote, error: voteError } = await supabase
      .from('match_votes')
      .insert({
        match_id,
        voter_id: user.id,
        voted_for_id
      })
      .select()
      .single()

    if (voteError) {
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
    }

    // Check if we have enough votes to determine winner (minimum 5 votes)
    const { data: allVotes, error: countError } = await supabase
      .from('match_votes')
      .select('id')
      .eq('match_id', match_id)

    if (!countError && allVotes && allVotes.length >= 5) {
      // Try to determine winner
      try {
        const winnerResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/compete/live/determine-winner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ match_id })
        })
        
        if (winnerResponse.ok) {
          const winnerResult = await winnerResponse.json()
        }
      } catch (error) {
        // Don't fail the vote request if winner determination fails
      }
    }

    return NextResponse.json({ success: true, data: vote })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
