-- Migration to add profile_background column to users table
-- This allows users to store their selected background theme

-- Add profile_background column to users table
ALTER TABLE users 
ADD COLUMN profile_background TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN users.profile_background IS 'Stores the ID of the user''s selected profile background theme (e.g., bg_sunset, bg_ocean, etc.)';

-- Create an index for faster queries (optional, useful if you plan to query by background)
CREATE INDEX idx_users_profile_background ON users(profile_background);

-- Add a check constraint to ensure only valid background IDs are stored (optional)
ALTER TABLE users 
ADD CONSTRAINT check_profile_background 
CHECK (profile_background IS NULL OR profile_background ~ '^bg_[a-z_]+$');

-- Update RLS policy if needed (assuming you have existing RLS policies)
-- This ensures users can only update their own profile_background
-- Note: Adjust the policy name and conditions based on your existing setup
-- 
-- Example RLS policy (uncomment and modify as needed):
-- DROP POLICY IF EXISTS users_update_own_profile ON users;
-- CREATE POLICY users_update_own_profile ON users 
--   FOR UPDATE USING (auth.uid() = id); 