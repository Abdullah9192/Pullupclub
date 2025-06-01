/*
  # Create and Update Submissions Table

  1. New Table
    - `submissions`: Stores user video submissions for the pull-up competition
      - Creates the table if it doesn't exist
      - Adds all required columns including new ones (club_affiliation, region, age, gender)
      - Sets up proper constraints and validation

  2. Security
    - Enables Row Level Security (RLS)
    - Adds policies for users to view/insert their own submissions
    - Adds policies for admins to view all submissions
*/

-- Create the submissions table if it doesn't exist
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