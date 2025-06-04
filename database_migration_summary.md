# Database Migration Summary: Splitting Users Table

## Overview
This migration splits the `users` table into two tables:
1. **`users`** - Contains basic profile information
2. **`users_data`** - Contains personal fitness data

## Tables Structure

### `users` table (existing - will have columns removed after migration)
Keeps:
- `id` (Primary Key)
- `username`
- `full_name`
- `bio`
- `avatar_url`
- `created_at`
- `updated_at`

### `users_data` table (new)
Contains:
- `id` (Primary Key)
- `user_id` (Foreign Key to auth.users.id)
- `age` (INTEGER)
- `weight` (DECIMAL 5,2)
- `height` (DECIMAL 5,2)
- `gender` (TEXT with CHECK constraint)
- `goals` (TEXT[] - array)
- `experience_level` (TEXT with CHECK constraint)
- `workouts_per_week` (INTEGER)
- `created_at`
- `updated_at`

## Files Updated

### 1. Database Schema (`migration_split_users_table.sql`)
- Creates the new `users_data` table
- Copies existing data from `users` to `users_data`
- Sets up proper indexes and RLS policies
- Creates trigger for automatic record creation
- Contains commented DROP statements for old columns

### 2. TypeScript Types (`app/[userId].tsx`)
- Updated `UserProfile` type to only include basic profile fields
- Added new `UserData` type for fitness-related data
- Created `UserProfileWithData` combined type
- Updated `fetchUserProfile` function to JOIN both tables

### 3. Subscription Service (`utils/subscriptionService.ts`)
- Updated `updateUserProfile` function to use UPSERT on `users_data` table
- Changed from UPDATE on `users` to UPSERT on `users_data`
- Added proper conflict resolution on `user_id`

## Database Queries Changed

### Before:
```sql
-- Selecting user profile
SELECT * FROM users WHERE id = $userId;

-- Updating user profile
UPDATE users SET age=$1, weight=$2, height=$3, ... WHERE id = $userId;
```

### After:
```sql
-- Selecting user profile with data
SELECT *, 
  users_data(age, weight, height, gender, goals, experience_level, workouts_per_week)
FROM users 
WHERE id = $userId;

-- Updating user data
INSERT INTO users_data (user_id, age, weight, height, ...)
VALUES ($userId, $age, $weight, $height, ...)
ON CONFLICT (user_id) DO UPDATE SET 
  age = $age, weight = $weight, height = $height, ...;
```

## Files That Don't Need Changes
These files only query basic user information and work unchanged:
- `app/discover-users.tsx` - Only selects: id, username, full_name, avatar_url, bio
- `app/(tabs)/social.tsx` - Only selects: id, username, full_name, avatar_url
- `app/(tabs)/profile.tsx` - Only selects: username, full_name, bio, avatar_url
- `components/SurveyModal.tsx` - Only defines interfaces, uses subscriptionService

## Migration Steps

1. **Run the SQL migration** (`migration_split_users_table.sql`)
2. **Deploy the updated code** with the file changes
3. **Test the application** to ensure:
   - User profiles still load correctly
   - Survey data still saves properly
   - Profile updates work
4. **After confirming everything works**, uncomment and run the DROP statements in the SQL file

## Security & Performance Notes

- **RLS Policies**: Added Row Level Security policies for `users_data` table
- **Indexes**: Created indexes on frequently queried columns (user_id, age, experience_level)
- **Data Integrity**: Foreign key constraint ensures data consistency
- **Automatic Record Creation**: Trigger creates `users_data` record when new user signs up

## Testing Checklist

- [ ] User profile pages load correctly
- [ ] Survey modal saves data properly
- [ ] User discovery still works
- [ ] Social features unchanged
- [ ] Profile editing works
- [ ] New user registration creates both records
- [ ] No performance regressions

## Rollback Plan

If issues occur:
1. Revert the code changes
2. The old columns still exist in `users` table (until DROP statements are run)
3. Data is preserved in both places during transition period 