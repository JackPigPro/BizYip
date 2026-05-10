import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ELO calculation constants
const K_FACTOR = 32
const MIN_VOTES_TO_FINALIZE = 5

function calculateElo(winnerElo: number, loserElo: number): { winnerNew: number; loserNew: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const winnerNew = Math.round(winnerElo + K_FACTOR * (1 - expectedScore))
  const loserNew = Math.round(loserElo + K_FACTOR * (0 - (1 - expectedScore)))
  
  return { winnerNew, loserNew }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { match_id } = await request.json()

    if (!match_id) {
      return NextResponse.json({ error: 'Missing match_id' }, { status: 400 })
    }

    // Fetch match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'voting') {
      return NextResponse.json({ error: 'Match is not in voting phase' }, { status: 400 })
    }

    // Count votes for each player
    const { data: votes, error: votesError } = await supabase
      .from('match_votes')
      .select('voted_for_id')
      .eq('match_id', match_id)

    if (votesError) {
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    if (votes.length < MIN_VOTES_TO_FINALIZE) {
      return NextResponse.json({ 
        error: `Need at least ${MIN_VOTES_TO_FINALIZE} votes to determine winner`,
        currentVotes: votes.length
      }, { status: 400 })
    }

    // Count votes for each player
    const player1Votes = votes.filter(v => v.voted_for_id === match.player1_id).length
    const player2Votes = votes.filter(v => v.voted_for_id === match.player2_id).length

    // Determine winner
    const winnerId = player1Votes > player2Votes ? match.player1_id : match.player2_id
    const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id

    // Get current ELO ratings
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, elo')
      .in('id', [match.player1_id, match.player2_id])

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
    }

    const player1Profile = profiles.find(p => p.id === match.player1_id)
    const player2Profile = profiles.find(p => p.id === match.player2_id)

    if (!player1Profile || !player2Profile) {
      return NextResponse.json({ error: 'User profiles not found' }, { status: 404 })
    }

    // Calculate new ELO ratings
    const winnerElo = winnerId === match.player1_id ? player1Profile.elo : player2Profile.elo
    const loserElo = loserId === match.player1_id ? player1Profile.elo : player2Profile.elo
    
    const { winnerNew, loserNew } = calculateElo(winnerElo, loserElo)

    // Update match with winner and completion
    const { error: updateMatchError } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'complete',
        completed_at: new Date().toISOString()
      })
      .eq('id', match_id)

    if (updateMatchError) {
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
    }

    // Update winner's ELO
    const { error: updateWinnerError } = await supabase
      .from('profiles')
      .update({ elo: winnerNew })
      .eq('id', winnerId)

    if (updateWinnerError) {
      return NextResponse.json({ error: 'Failed to update winner ELO' }, { status: 500 })
    }

    // Update loser's ELO
    const { error: updateLoserError } = await supabase
      .from('profiles')
      .update({ elo: loserNew })
      .eq('id', loserId)

    if (updateLoserError) {
      return NextResponse.json({ error: 'Failed to update loser ELO' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      winnerId,
      voteCounts: {
        player1: player1Votes,
        player2: player2Votes
      },
      eloChanges: {
        winner: { old: winnerElo, new: winnerNew, change: winnerNew - winnerElo },
        loser: { old: loserElo, new: loserNew, change: loserNew - loserElo }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
