/*
  # Consolidated Database Setup
  
  This migration combines all necessary setup in the correct order:
  1. Create base tables
  2. Add columns and constraints
  3. Set up policies and permissions
  4. Enable RLS
*/

-- Create submissions table with all required columns
CREATE TABLE IF NOT EXISTS submissions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    pull_up_count integer NOT NULL,
    video_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    reviewer_notes text,
    actual_pull_up_count integer,
    club_affiliation text,
    region text NOT NULL,
    age integer NOT NULL,
    gender text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone DEFAULT null
);

-- Add check constraints
DO $$ 
BEGIN
  -- Only add constraints if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_age') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_age CHECK (age >= 16 AND age <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_gender') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_pull_up_count') THEN
    ALTER TABLE submissions ADD CONSTRAINT valid_pull_up_count CHECK (pull_up_count > 0 AND pull_up_count <= 100);
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
    DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
    ON submissions
    FOR SELECT
    TO authenticated
    USING ((user_id = auth.uid()) AND (deleted_at IS NULL));

-- Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions"
    ON submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
    ON submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'user',
    is_profile_completed boolean DEFAULT false,
    full_name text,
    email text,
    age integer,
    gender text,
    region text,
    club_affiliation text,
    street_address text,
    city text,
    state text,
    zip_code text,
    country text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone DEFAULT null
);

-- Add super_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'super_admin'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN super_admin boolean DEFAULT false;
    END IF;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING ((user_id = auth.uid()) AND (deleted_at IS NULL));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.deleted_at IS NULL
        )
    );

-- Create admin_logs view
CREATE OR REPLACE VIEW admin_logs AS
SELECT 
    s.id as submission_id,
    s.user_id,
    up.full_name,
    up.email,
    s.pull_up_count,
    s.video_url,
    s.status,
    s.reviewer_notes,
    s.actual_pull_up_count,
    s.created_at,
    s.updated_at
FROM submissions s
JOIN user_profiles up ON s.user_id = up.user_id
WHERE s.deleted_at IS NULL
AND up.deleted_at IS NULL;

-- Grant access to admin_logs view
GRANT SELECT ON admin_logs TO authenticated; 