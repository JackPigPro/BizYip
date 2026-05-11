-- Function to submit a vote in weekly duel with ELO-style rating
CREATE OR REPLACE FUNCTION submit_vote(
  voter_id_param UUID,
  duel_id_param UUID,
  winner_submission_id UUID,
  loser_submission_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  voter_elo INTEGER;
  vote_weight_val DECIMAL;
  winner_elo INTEGER;
  loser_elo INTEGER;
  last_vote_time TIMESTAMP;
  cooldown_error JSONB;
BEGIN
  -- Get voter's current ELO
  SELECT elo INTO voter_elo 
  FROM profiles 
  WHERE id = voter_id_param;
  
  -- If voter has no ELO, default to 0
  IF voter_elo IS NULL THEN
    voter_elo := 0;
  END IF;
  
  -- Check cooldown (30 seconds)
  SELECT MAX(created_at) INTO last_vote_time
  FROM duel_votes
  WHERE voter_id = voter_id_param;
  
  IF last_vote_time > NOW() - INTERVAL '30 seconds' THEN
    cooldown_error := jsonb_build_object('error', 'Please wait 30 seconds between votes');
    RETURN cooldown_error;
  END IF;
  
  -- Calculate vote weight
  vote_weight_val := get_vote_weight(voter_elo);
  
  -- Get current ELO of both participants
  SELECT elo INTO winner_elo 
  FROM profiles 
  WHERE id = (SELECT user_id FROM duel_submissions WHERE id = winner_submission_id);
  
  SELECT elo INTO loser_elo 
  FROM profiles 
  WHERE id = (SELECT user_id FROM duel_submissions WHERE id = loser_submission_id);
  
  -- If participants have no ELO, default to 0
  IF winner_elo IS NULL THEN winner_elo := 0; END IF;
  IF loser_elo IS NULL THEN loser_elo := 0; END IF;
  
  -- Update vote scores and counts
  UPDATE duel_submissions 
  SET vote_score = vote_score + vote_weight_val,
      vote_count = vote_count + 1
  WHERE id = winner_submission_id;
  
  UPDATE duel_submissions 
  SET vote_score = vote_score - vote_weight_val,
      vote_count = vote_count + 1
  WHERE id = loser_submission_id;
  
  -- Insert the vote
  INSERT INTO duel_votes (
    voter_id, duel_id, winner_submission_id, loser_submission_id, 
    voter_elo, vote_weight, vote_score, vote_count
  ) VALUES (
    voter_id_param, duel_id_param, winner_submission_id, loser_submission_id,
    voter_elo, vote_weight_val, vote_weight_val, 1
  );
  
  -- Insert into seen_pairs to prevent re-voting
  INSERT INTO seen_pairs (
    voter_id, duel_id, submission_a_id, submission_b_id
  ) VALUES (
    voter_id_param, duel_id_param, winner_submission_id, loser_submission_id
  ) ON CONFLICT (voter_id, duel_id) DO NOTHING;
  
  -- Award voter +1 ELO for voting
  INSERT INTO elo_history (
    user_id, elo_change, new_elo, reason
  ) VALUES (
    voter_id_param, 1, voter_elo + 1, 'duel_vote'
  );
  
  UPDATE profiles 
  SET elo = elo + 1
  WHERE id = voter_id_param;
  
  RETURN jsonb_build_object('success', true, 'message', 'Vote submitted successfully');
END;
$$;
