# Email Verification Flow

This document explains the email verification flow implemented in FITCORE app to ensure users are only added to the database after confirming their email address.

## Overview

When a user registers in the app, they are required to verify their email address before gaining full access to the application. The user data is only stored in the database after email verification is successfully completed.

## Implementation Details

### 1. Registration Process

1. User fills out the registration form with their name, email, and password
2. Upon submission, an account is created in Supabase Auth, but not in the custom database tables 
3. A verification email is sent to the user's email address
4. The user is redirected to the login page with a message to check their email

### 2. Email Verification

1. User opens the verification email and clicks on the verification link
2. Supabase validates the email and updates the `email_confirmed_at` field in the Auth system
3. A database trigger detects this change and creates a corresponding record in the custom `users` table

### 3. Login Process

1. When a user attempts to log in, the app checks if their email has been verified
2. If the email is not verified, the user is prompted to check their email and complete verification
3. Only users with verified emails can successfully log in and access protected areas of the app

### 4. Database Trigger

We use a Supabase database trigger to automatically create user records in the `users` table when email verification is confirmed. This ensures that only verified users have records in the application database.

The trigger is defined in `database/supabase-triggers.md` and should be implemented in the Supabase dashboard.

## User Experience

From the user perspective:

1. User registers in the app
2. User receives a message to check their email for verification
3. User verifies their email by clicking the link in the email
4. User can then log in to the app with full access

## Benefits

- Enhanced security by ensuring email ownership
- Reduced spam accounts
- Higher quality user data
- Better compliance with data protection regulations

## Troubleshooting

If users report issues with the email verification process:

1. Check if the verification email was received (may be in spam folder)
2. Ensure the database trigger for email verification is correctly implemented
3. Verify that email redirects are properly configured in Supabase
4. Check for any errors in the authentication logs in Supabase dashboard 