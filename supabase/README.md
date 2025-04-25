# Supabase Database Migrations

This directory contains SQL migrations for the Supabase database.

## How to Apply Migrations

You can apply the migrations in the Supabase dashboard using the SQL Editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open each migration file in order of their timestamp prefix
4. Execute the SQL statements

Alternatively, if you have the Supabase CLI installed, you can apply migrations with:

```bash
supabase migration up
```

## Latest Migrations

### User Followers Table (20240717_create_user_followers.sql)

This migration adds support for the user follow system. It creates:

- A `user_followers` table that tracks which users follow other users
- Appropriate indexes for performance
- Row-level security policies to ensure data protection

After applying this migration, users will be able to:
- Follow other users
- See their followers and following lists
- Unfollow users 