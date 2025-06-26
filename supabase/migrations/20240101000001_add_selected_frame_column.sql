-- Add selected_frame column to users table
-- This will store the ID of the currently equipped profile frame

ALTER TABLE users 
ADD COLUMN selected_frame TEXT DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN users.selected_frame IS 'ID of the currently equipped profile image frame (e.g., frame_golden, frame_neon)';

-- Optional: Create an index if we plan to query by frame type frequently
CREATE INDEX idx_users_selected_frame ON users(selected_frame); 