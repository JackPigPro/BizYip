-- Add auth_method column to profiles table
ALTER TABLE profiles 
ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'email';

-- Create index for faster lookups
CREATE INDEX idx_profiles_auth_method ON profiles(auth_method);

-- Add comment
COMMENT ON COLUMN profiles.auth_method IS 'Authentication method used to create the account: "email" or "google"';
