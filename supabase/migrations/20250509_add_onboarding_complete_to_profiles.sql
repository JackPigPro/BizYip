-- Add onboarding_complete column to profiles table
ALTER TABLE profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;

-- Add index for better performance on onboarding_complete queries
CREATE INDEX idx_profiles_onboarding_complete ON profiles(onboarding_complete);
