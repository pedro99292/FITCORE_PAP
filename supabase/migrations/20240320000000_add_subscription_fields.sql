-- Add subscription type column
ALTER TABLE users ADD COLUMN subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'monthly', 'annual', 'lifetime'));

-- Add subscription status column
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial'));

-- Add subscription start and end dates
ALTER TABLE users ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Add user profile fields
ALTER TABLE users ADD COLUMN age INTEGER;
ALTER TABLE users ADD COLUMN height NUMERIC;
ALTER TABLE users ADD COLUMN weight NUMERIC;
ALTER TABLE users ADD COLUMN experience_level TEXT CHECK (experience_level IN ('novice', 'experienced', 'advanced'));
ALTER TABLE users ADD COLUMN workouts_per_week INTEGER;
ALTER TABLE users ADD COLUMN fitness_goals TEXT[];
ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'prefer not to say')); 