# BizYip — Full Context

## Supabase Tables & Key Columns

### profiles
id, username, email, auth_method, onboarding_complete, agreed_to_terms,
bio, skills (array), status_tags (array), twitter, linkedin, discord,
open_to_cofounder, theme_preference, avatar, elo (default 500),
country, project_stage, created_at, updated_at

### daily_battle
id, prompt, date, created_at

### daily_submissions
id, user_id, battle_id, content, created_at

### daily_streaks
user_id, current_streak, longest_streak, last_submission_date, updated_at

### daily_likes
id, user_id, submission_id, created_at

### weekly_duel
id + duel info columns

### duel_submissions
id, user_id, duel_id, content, vote_score, vote_count, final_rank,
elo_awarded, created_at

### duel_votes
id, voter_id, duel_id, winner_submission_id, loser_submission_id,
voter_elo, vote_weight, created_at

### duel_winners
id, duel_id, user_id, rank, elo_awarded, created_at

### matches (Live 1v1)
id, game_mode, status, player1_id, player2_id, prompt,
time_limit_seconds, player1_submitted, player2_submitted,
room_code, is_private, winner_id, created_at, started_at, completed_at

### match_submissions
id, match_id, user_id, content, image_url, created_at

### match_votes
id, match_id, voter_id, voted_for_id, created_at

### elo_history
id, user_id, elo_change, new_elo, reason, created_at

### ideas
id, user_id, title, content, is_public, created_at, edited_at

### idea_comments
id, idea_id, user_id, parent_id, content, edited_at, created_at

### idea_likes
id, idea_id, user_id, created_at

### cofounder_requests
id, sender_id, receiver_id, status, created_at

### seen_pairs
columns for weekly duel voting pair tracking

### teacher_emails
email capture for Learn section launch

## ELO System
- Starting ELO: 500 (Builder rank)
- Floor: 0
- Streak ELO: Day 0 to 1 +1, Days 2 to 6 +2, Days 7+ +3
- Live 1v1: Win +5, Lose -3, Draw 0
- Weekly Duel: 1st +50, 2nd +40, 3rd +30, 4th-5th +20, 6th-10th +15, submitted +5

## Rank Tiers
- Trainee: 0-499
- Builder: 500-749
- Creator: 750-999
- Founder: 1000-1249
- Visionary: 1250-1499
- Icon: 1500-1749
- Titan: 1750-1999
- Unicorn: 2000+

## Auth
- Google OAuth and email/password
- auth_method column stores 'google' or 'email'
- onboarding_complete must be true to access dashboard
- Admin user ID: a4dc1d84-fc05-4018-b3ce-7c60f3a4244c

## Key Rules
- ELO always stored in profiles.elo NOT user_stats (deleted)
- No display_name anywhere — use username only
- No github social link — only twitter, linkedin, discord
- No location column — use country
- No stage column — use project_stage
- Trainee is punishment tier not starting tier

## RLS Policies Summary
All tables have RLS enabled. Key rules:
- profiles: public read, users update/insert own
- daily_submissions: public read, auth insert
- ideas: public read (is_public=true), auth insert/update/delete own
- idea_comments: public read, auth insert/update/delete own
- matches: public read, auth insert, players update own
- weekly_duel: public read, admin only insert/update/delete
- Admin UUID: a4dc1d84-fc05-4018-b3ce-7c60f3a4244c