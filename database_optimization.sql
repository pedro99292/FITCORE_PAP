-- Database optimization queries for faster workout loading
-- Run these queries in your Supabase SQL editor to improve performance

-- Index for workouts table (user_id is frequently queried)
CREATE INDEX IF NOT EXISTS idx_workouts_user_id_created_at 
ON workouts (user_id, created_at DESC);

-- Index for workout_sets table (workout_id is frequently joined)
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id 
ON workout_sets (workout_id);

-- Composite index for workout_sets to optimize the join query
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise 
ON workout_sets (workout_id, exercise_id, exercise_target);

-- New optimized index for the bulk stats query
CREATE INDEX IF NOT EXISTS idx_workout_sets_bulk_stats 
ON workout_sets (workout_id, exercise_id, exercise_target) 
WHERE exercise_id IS NOT NULL;

-- Index for sessions table (used in WorkoutContext stats)
CREATE INDEX IF NOT EXISTS idx_sessions_user_status 
ON sessions (user_id, status);

-- Index for session_sets table (used in WorkoutContext stats)
CREATE INDEX IF NOT EXISTS idx_session_sets_session_id 
ON session_sets (session_id);

-- Covering index for workout_sets to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_workout_sets_covering 
ON workout_sets (workout_id) 
INCLUDE (exercise_id, exercise_target);

-- Optimize the workouts table for better query performance
ANALYZE workouts;
ANALYZE workout_sets;
ANALYZE sessions;
ANALYZE session_sets; 