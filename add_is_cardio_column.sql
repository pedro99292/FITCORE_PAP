-- Add is_cardio column to workout_sets table
-- This column is used to distinguish between cardio and strength exercises

ALTER TABLE workout_sets 
ADD COLUMN is_cardio BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column purpose
COMMENT ON COLUMN workout_sets.is_cardio IS 'Indicates whether this exercise set is for a cardio exercise (TRUE) or strength exercise (FALSE)';

-- Optional: Add an index for better query performance when filtering by exercise type
CREATE INDEX idx_workout_sets_is_cardio ON workout_sets(is_cardio);

-- Optional: Add a composite index for common queries
CREATE INDEX idx_workout_sets_workout_cardio ON workout_sets(workout_id, is_cardio); 