-- Function to distribute prizes for completed weekly duel
CREATE OR REPLACE FUNCTION distribute_duel_prizes(duel_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  submission_count INTEGER;
  current_status TEXT;
  prize_distributed BOOLEAN;
BEGIN
  -- Check if duel exists and is in voting status
  SELECT status INTO current_status
  FROM weekly_duel
  WHERE id = duel_id_param;
  
  IF current_status != 'voting' THEN
    RETURN jsonb_build_object('error', 'Duel is not in voting status');
  END IF;
  
  -- Count total submissions
  SELECT COUNT(*) INTO submission_count
  FROM duel_submissions
  WHERE duel_id = duel_id_param;
  
  -- Rank submissions by vote_score descending
  UPDATE duel_submissions 
  SET final_rank = (
    SELECT rank 
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY vote_score DESC, created_at ASC) as rank
      FROM duel_submissions
      WHERE duel_id = duel_id_param
    ) ranked
    WHERE ranked.id = duel_submissions.id
  )
  WHERE duel_id = duel_id_param;
  
  -- Award ELO based on final rank
  UPDATE duel_submissions 
  SET elo_awarded = CASE 
    WHEN final_rank = 1 THEN 100
    WHEN final_rank = 2 THEN 90
    WHEN final_rank = 3 THEN 80
    WHEN final_rank >= 4 AND final_rank <= 5 THEN 60
    WHEN final_rank >= 6 AND final_rank <= 10 THEN 40
    WHEN final_rank >= 11 THEN 10
    ELSE 0
  END
  WHERE duel_id = duel_id_param AND final_rank IS NOT NULL;
  
  -- Update profiles for winners
  UPDATE profiles 
  SET elo = elo + elo_awarded
  FROM duel_submissions
  WHERE duel_submissions.duel_id = duel_id_param 
    AND duel_submissions.user_id = profiles.id
    AND duel_submissions.elo_awarded > 0;
  
  -- Log ELO changes to history
  INSERT INTO elo_history (
    user_id, elo_change, new_elo, reason
  )
  SELECT 
    duel_submissions.user_id, 
    elo_awarded, 
    profiles.elo + elo_awarded,
    'weekly_duel_prize'
  FROM duel_submissions
  JOIN profiles ON duel_submissions.user_id = profiles.id
  WHERE duel_submissions.duel_id = duel_id_param 
    AND duel_submissions.elo_awarded > 0;
  
  -- Insert winners into duel_winners table
  INSERT INTO duel_winners (
    duel_id, user_id, rank, elo_awarded
  )
  SELECT 
    duel_id_param, 
    user_id, 
    final_rank, 
    elo_awarded
  FROM duel_submissions
  WHERE duel_id = duel_id_param 
    AND final_rank IS NOT NULL
    AND elo_awarded > 0;
  
  -- Mark duel as completed with prizes distributed
  UPDATE weekly_duel 
  SET status = 'completed',
      prize_distributed = TRUE
  WHERE id = duel_id_param;
  
  RETURN jsonb_build_object('success', true, 'message', 'Prizes distributed successfully');
END;
$$;
