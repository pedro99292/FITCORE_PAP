-- Script to clean up story-related database tables
-- Run this script to remove all story functionality from the database

-- Drop the user_stories table if it exists
DROP TABLE IF EXISTS user_stories CASCADE;

-- Drop the story_views table if it exists
DROP TABLE IF EXISTS story_views CASCADE;

-- Drop any story-related indexes
DROP INDEX IF EXISTS idx_user_stories_user_id;
DROP INDEX IF EXISTS idx_user_stories_expires_at;
DROP INDEX IF EXISTS idx_story_views_story_id;
DROP INDEX IF EXISTS idx_story_views_user_id;

-- Drop any story-related functions
DROP FUNCTION IF EXISTS update_story_view_count() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_stories() CASCADE;

-- Drop any story-related triggers
DROP TRIGGER IF EXISTS trigger_update_story_view_count ON story_views;

-- Note: This script removes all story-related database objects
-- Make sure to backup your database before running this script if needed 