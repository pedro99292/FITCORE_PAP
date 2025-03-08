# Supabase Database Triggers for User Management

This document outlines the required database trigger setup in Supabase to ensure that users are only added to custom tables after email verification.

## Email Verification Trigger

In Supabase, users are stored in the `auth.users` table by default when they register. We need to create a trigger that only adds users to our custom `users` table after they have verified their email.

### Step 1: Create the SQL Function

Log into your Supabase dashboard and go to the SQL Editor. Create a new function with the following SQL:

```sql
-- Function that will be called by the trigger when a user confirms their email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into users table if the user has confirmed their email
  -- This checks if email_confirmed_at was previously NULL and is now set to a timestamp
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Insert the user into our custom users table
    INSERT INTO public.users (
      id,
      email,
      username,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),  -- Use username from metadata, fallback to email
      NEW.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Avoid duplicate entries
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();
```

### Step 2: Create the Custom Users Table (if not exists)

If you haven't already created the custom users table, use the following SQL:

```sql
-- Create custom users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

### Implementation Notes

1. The trigger only creates an entry in the `public.users` table when a user confirms their email.
2. This ensures that only verified users will have records in the application database.
3. The trigger monitors changes to the `email_confirmed_at` field in the `auth.users` table and acts when it changes from NULL to a timestamp value.

### Testing

To verify the trigger works:
1. Register a new user in your application
2. Confirm that no record is created in the `public.users` table
3. Verify the email
4. Confirm that a record is now created in the `public.users` table 